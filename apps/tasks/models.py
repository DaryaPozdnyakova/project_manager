from django.conf import settings
from django.db import models
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.common import delete_file
import shutil
import os

from apps.projects.models import Project
from apps.projects.models import ProjectFile
from apps.users.models import Notification


class Task(models.Model):
    STATUS_CHOICES = [
        ('created', 'Создано'),
        ('in_progress', 'В работе'),
        ('review', 'Нужна проверка'),
        ('accepted', 'Принято'),
        ('rejected', 'Отклонено'),
        ('overdue', 'Просрочено'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks'
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        verbose_name='Исполнитель'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_tasks',
        verbose_name='Автор задачи'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created'
    )

    is_open_for_self_assign = models.BooleanField(
        default=False,
        verbose_name='Доступна для самостоятельного выбора'
    )

    self_assigned = models.BooleanField(
        default=False,
        verbose_name='Взята самостоятельно'
    )

    deadline = models.DateTimeField(null=True, blank=True)

    start_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Дата начала'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'
        ordering = ['deadline', '-created_at']
    
    def clean(self):
        if self.assignee and self.project:
            is_project_member = self.project.members.filter(user=self.assignee).exists()
            is_admin = self.assignee.role == 'admin'

            if not is_project_member and not is_admin:
                raise ValidationError({
                    'assignee': 'Исполнитель должен быть участником проекта или администратором.'
                })
        if self.created_by and self.project:
            is_supervisor = self.project.supervisor == self.created_by
            is_admin = self.created_by.role == 'admin'
            is_teamlead = self.project.members.filter(
                user=self.created_by,
                role='Тимлид',
            ).exists()

            if not is_supervisor and not is_admin and not is_teamlead:
                raise ValidationError({
                    'created_by': 'Создавать задачи может только руководитель проекта, тимлид или администратор.'
                })
    
    def __str__(self):
        return self.title

def submission_file_upload_path(instance, filename):
    project_id = instance.submission.task.project_id
    return f'project_files/project_{project_id}/answers/{filename}'

class Submission(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='submissions'
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submissions'
    )

    text_answer = models.TextField(
        blank=True,
        verbose_name='Текстовый ответ'
    )

    link = models.URLField(
        blank=True,
        verbose_name='Ссылка на результат'
    )

    file = models.FileField(
        upload_to=submission_file_upload_path,
        blank=True,
        null=True,
        verbose_name='Файл'
    )

    grade = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name='Оценка'
    )

    publish_to_project_files = models.BooleanField(
    default=False,
    verbose_name='Опубликовать файл в материалы проекта'
    )

    target_folder = models.ForeignKey(
        'projects.ProjectFolder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submissions',
        verbose_name='Папка для публикации'
    )

    REVIEW_STATUS_CHOICES = (
        ('pending', 'Ожидает проверки'),
        ('accepted', 'Принято'),
        ('rejected', 'Отклонено'),
    )

    review_status = models.CharField(
        max_length=20,
        choices=REVIEW_STATUS_CHOICES,
        default='pending',
        verbose_name='Статус проверки'
    )

    teacher_comment = models.TextField(
        blank=True,
        verbose_name='Комментарий преподавателя'
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    checked_at = models.DateTimeField(null=True, blank=True)

    checked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checked_submissions',
        verbose_name='Проверил'
    )

    class Meta:
        verbose_name = 'Сдача задания'
        verbose_name_plural = 'Сдачи заданий'
        ordering = ['-submitted_at']
    
    def clean(self):
        if self.student and self.task:
            project = self.task.project

            is_project_member = project.members.filter(user=self.student).exists()
            is_admin = self.student.role == 'admin'

            if not is_project_member and not is_admin:
                raise ValidationError({
                    'student': 'Сдавать задание может только участник проекта или администратор.'
                })

        if not self.text_answer and not self.link and not self.file:
            raise ValidationError(
                'Необходимо добавить текстовый ответ, ссылку или файл.'
            )
        if self.grade is not None:
            if self.student and self.student.role == 'student':
                pass
        
        if self.grade is not None and self.checked_by:
            is_supervisor = self.task.project.supervisor == self.checked_by
            is_admin = self.checked_by.role == 'admin'

            if not is_supervisor and not is_admin:
                raise ValidationError({
                    'checked_by': 'Оценку может выставлять только преподаватель или администратор.'
                })

    def __str__(self):
        return f'{self.student} — {self.task}'


class SubmissionFile(models.Model):
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name='Сдача задания'
    )

    project_file = models.ForeignKey(
        'projects.ProjectFile',
        on_delete=models.CASCADE,
        related_name='submission_files',
        verbose_name='Файл проекта',
        null=True,
        blank=True
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата загрузки'
    )

    class Meta:
        verbose_name = 'Файл сдачи'
        verbose_name_plural = 'Файлы сдач'
        ordering = ['uploaded_at']

    def __str__(self):
        return f'Файл к сдаче #{self.submission.id}'

class Comment(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments'
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )

    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies',
        verbose_name='Ответ на комментарий'
    )

    text = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'
        ordering = ['created_at']
    
    def clean(self):
        if self.author and self.task:
            project = self.task.project

            is_member = project.members.filter(user=self.author).exists()
            is_supervisor = project.supervisor == self.author
            is_admin = self.author.role == 'admin'

            if not (is_member or is_supervisor or is_admin):
                raise ValidationError(
                    'Комментарий может оставить только участник проекта, преподаватель или администратор.'
                )

    def __str__(self):
        return f'Комментарий от {self.author}'

class TaskHistory(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='history'
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='task_changes'
    )

    field_name = models.CharField(max_length=100)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)

    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'История изменения задачи'
        verbose_name_plural = 'История изменений задач'
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.task} — {self.field_name}'
    
class SubTask(models.Model):
    STATUS_CHOICES = (
        ('created', 'Создано'),
        ('in_progress', 'В работе'),
        ('done', 'Выполнено'),
    )

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='subtasks'
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Подзадача'
        verbose_name_plural = 'Подзадачи'
        ordering = ['created_at']

    def __str__(self):
        return self.title

class Grade(models.Model):

    SEMESTER_CHOICES = [
        ('autumn', 'Осенний семестр'),
        ('spring', 'Весенний семестр'),
    ]

    GRADE_TYPE_CHOICES = [
        ('regular', 'Обычная оценка'),
        ('first_attestation', 'Первая аттестация'),
        ('second_attestation', 'Вторая аттестация'),
        ('intermediate_attestation', 'Промежуточная аттестация'),
        ('semester_total', 'Семестровая оценка'),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='grades'
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='grades'
    )

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='grades',
        verbose_name='Задача'
    )

    value = models.PositiveSmallIntegerField(
        verbose_name='Оценка'
    )

    comment = models.TextField(
        blank=True,
        verbose_name='Комментарий'
    )

    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='given_grades',
        verbose_name='Кто выставил'
    )

    reason = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name='Основание оценки'
    )

    semester = models.CharField(
        max_length=20,
        choices=SEMESTER_CHOICES,
        default='spring',
        verbose_name='Семестр'
    )

    grade_type = models.CharField(
        max_length=40,
        choices=GRADE_TYPE_CHOICES,
        default='regular',
        verbose_name='Тип оценки'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Оценка'
        verbose_name_plural = 'Журнал оценок'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.student} — {self.value}'

@receiver(pre_save, sender=Task)
def handle_task_changes(sender, instance, **kwargs):
    if not instance.pk:
        return

    old_task = Task.objects.get(pk=instance.pk)

    if old_task.status != instance.status:
        TaskHistory.objects.create(
            task=instance,
            changed_by=None,
            field_name='status',
            old_value=old_task.get_status_display(),
            new_value=instance.get_status_display()
        )

    if old_task.assignee != instance.assignee and instance.assignee:
        Notification.objects.create(
            user=instance.assignee,
            title='Вам назначена задача',
            text=f'Вам назначена задача: {instance.title}'
        )
    
    if old_task.deadline != instance.deadline and instance.assignee:
        Notification.objects.create(
            user=instance.assignee,
            title='Изменён срок задачи',
            text=f'У задачи "{instance.title}" изменён срок выполнения.'
        )

@receiver(post_save, sender=Submission)
def update_task_status_after_submission(sender, instance, created, **kwargs):
    if created:
        task = instance.task
        task.status = 'review'
        task.save()

        Notification.objects.create(
            user=task.project.supervisor,
            title='Новая сдача задания',
            text=f'Пользователь {instance.student.full_name} сдал задание "{task.title}" на проверку.'
        )

@receiver(post_save, sender=Grade)
def notify_student_about_grade(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.student,
            title='Выставлена оценка',
            text=f'По проекту "{instance.project}" выставлена оценка: {instance.value}.'
        )

@receiver(post_save, sender=Submission)
def create_grade_from_submission(sender, instance, created, **kwargs):
    if instance.grade is not None:
        Grade.objects.get_or_create(
            student=instance.student,
            project=instance.task.project,
            task=instance.task,
            defaults={
                'value': instance.grade,
                'comment': instance.teacher_comment,
                'graded_by': instance.task.created_by,
            }
        )

@receiver(pre_save, sender=Submission)
def set_checked_at_when_graded(sender, instance, **kwargs):
    if instance.grade is not None and instance.checked_at is None:
        instance.checked_at = timezone.now()

@receiver(post_save, sender=Submission)
def update_task_status_after_review(sender, instance, **kwargs):
    task = instance.task

    if instance.review_status == 'accepted':
        task.status = 'accepted'
        task.save()

    elif instance.review_status == 'rejected':
        task.status = 'rejected'
        task.save()

