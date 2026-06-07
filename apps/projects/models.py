from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.text import slugify
import os


class Project(models.Model):
    STATUS_CHOICES = (
        ('created', 'Создан'),
        ('active', 'Активен'),
        ('completed', 'Завершён'),
        ('archived', 'Архивирован'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    semester = models.CharField(
        max_length=50,
        blank=True,
        help_text='Например: 2025/2026, весенний семестр'
    )

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created'
    )

    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='supervised_projects',
        verbose_name='Руководитель проекта'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Проект'
        verbose_name_plural = 'Проекты'
        ordering = ['-created_at']
    
    def clean(self):
        if self.supervisor and self.supervisor.role not in ['teacher', 'admin']:
            raise ValidationError({
                'supervisor': 'Руководителем проекта может быть только преподаватель или администратор.'
            })
    
    def get_progress(self):
        total_tasks = self.tasks.count()

        if total_tasks == 0:
            return 0

        completed_tasks = self.tasks.filter(status='accepted').count()

        return round((completed_tasks / total_tasks) * 100)

    def __str__(self):
        return self.title
    
class ProjectMember(models.Model):
    role = models.CharField(
        max_length=100,
        default='Участник',
        verbose_name='Роль в проекте',
        help_text='Например: тимлид, дизайнер, аналитик, backend-разработчик'
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='members'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships'
    )

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Участник проекта'
        verbose_name_plural = 'Участники проектов'
        unique_together = ('project', 'user')

    def __str__(self):
        return f'{self.user} — {self.project}'

class Attendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Присутствовал'),
        ('absent', 'Отсутствовал'),
        ('sick', 'Болел'),
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )

    date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='present'
    )

    comment = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Посещаемость'
        verbose_name_plural = 'Посещаемость'
        unique_together = ('project', 'student', 'date')
        ordering = ['-date']

    def __str__(self):
        return f'{self.student} — {self.date}'


class ProjectFolder(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='folders',
        verbose_name='Проект'
    )

    name = models.CharField(
        max_length=255,
        verbose_name='Название папки'
    )

    storage_path = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Путь папки в хранилище'
    )

    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Родительская папка'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_project_folders',
        verbose_name='Создал'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Папка проекта'
        verbose_name_plural = 'Папки проекта'
        unique_together = ('project', 'parent', 'name')

    def __str__(self):
        return self.name

def project_file_upload_path(instance, filename):
    project_id = instance.project_id or 'unknown'

    if instance.folder and instance.folder.storage_path:
        return f'{instance.folder.storage_path}/{filename}'

    if instance.submission or instance.task:
        return f'project_files/project_{project_id}/answers/{filename}'

    return f'project_files/project_{project_id}/root/{filename}'

class ProjectFile(models.Model):
    ACCESS_CHOICES = (
        ('all', 'Все участники проекта'),
        ('teacher', 'Только преподаватель'),
        ('admin', 'Только администратор'),
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='files'
    )

    display_name = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Отображаемое название файла'
    )
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_project_files'
    )

    file = models.FileField(
        upload_to=project_file_upload_path
    )

    folder = models.ForeignKey(
        ProjectFolder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='files',
        verbose_name='Папка'
    )

    description = models.TextField(blank=True)

    is_visible = models.BooleanField(
        default=True,
        verbose_name='Показывать в файловом хранилище'
    )

    source_type = models.CharField(
        max_length=30,
        default='manual',
        choices=(
            ('manual', 'Загружен вручную'),
            ('submission', 'Файл ответа на задачу'),
        ),
        verbose_name='Источник файла'
    )

    submission = models.ForeignKey(
        'tasks.Submission',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_files',
        verbose_name='Связанная сдача'
    )

    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_files',
        verbose_name='Связанная задача'
    )

    access_level = models.CharField(
        max_length=20,
        choices=ACCESS_CHOICES,
        default='all'
    )

    folder = models.ForeignKey(
        'ProjectFolder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='files'
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Файл проекта'
        verbose_name_plural = 'Файлы проекта'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.project} — {self.file.name}'

class Message(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_messages'
    )

    text = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Сообщение'
        verbose_name_plural = 'Сообщения чата'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author} — {self.project}'

class Idea(models.Model):
    STATUS_CHOICES = (
        ('new', 'Новая'),
        ('discussion', 'На обсуждении'),
        ('accepted', 'Принята'),
        ('rejected', 'Отклонена'),
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='ideas'
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ideas'
    )

    title = models.CharField(max_length=255)
    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Идея'
        verbose_name_plural = 'Доска идей'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Meeting(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='meetings',
        verbose_name='Проект'
    )

    title = models.CharField(
        max_length=255,
        verbose_name='Название встречи'
    )

    meeting_url = models.URLField(
        verbose_name='Ссылка на встречу'
    )

    scheduled_at = models.DateTimeField(
        verbose_name='Дата и время встречи'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_meetings',
        verbose_name='Создал'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Созвон'
        verbose_name_plural = 'Созвоны'
        ordering = ['scheduled_at']

    def __str__(self):
        return f'{self.title} — {self.project}'


class ProjectActivity(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='activities',
        verbose_name='Проект'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_activities',
        verbose_name='Пользователь'
    )

    title = models.CharField(
        max_length=255,
        verbose_name='Заголовок'
    )

    text = models.TextField(
        verbose_name='Текст'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )

    class Meta:
        verbose_name = 'Активность проекта'
        verbose_name_plural = 'Активность проектов'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project}: {self.title}'

class ProjectChatMessage(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        verbose_name='Проект'
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_chat_messages',
        verbose_name='Автор'
    )

    text = models.TextField(
        verbose_name='Сообщение'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )

    class Meta:
        verbose_name = 'Сообщение чата проекта'
        verbose_name_plural = 'Сообщения чата проекта'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author} — {self.project}'
    
class ProjectInvitation(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='invitations',
        verbose_name='Проект'
    )

    email = models.EmailField(
        verbose_name='Email'
    )

    role = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Роль в проекте'
    )

    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_project_invitations',
        verbose_name='Кем приглашён'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата приглашения'
    )

    class Meta:
        verbose_name = 'Приглашение в проект'
        verbose_name_plural = 'Приглашения в проекты'
        unique_together = ('project', 'email')

    def __str__(self):
        return f'{self.email} — {self.project}'