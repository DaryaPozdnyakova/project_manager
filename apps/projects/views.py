from apps.common import SafeModelViewSet
from apps.permissions import IsTeacherOrAdminOrReadOnly, IsProjectParticipantOrAdmin
from rest_framework.exceptions import PermissionDenied

from .models import Project, ProjectMember, Attendance, ProjectFile, Message, Idea, ProjectFolder, Meeting, ProjectActivity, ProjectChatMessage, ProjectInvitation
from .serializers import (
    ProjectSerializer,
    ProjectMemberSerializer,
    AttendanceSerializer,
    ProjectFileSerializer,
    MessageSerializer,
    IdeaSerializer,
    AddProjectMemberSerializer,
    ProjectFolderSerializer,
    MeetingSerializer,
    ProjectActivitySerializer,
    ProjectChatMessageSerializer,
)
from apps.users.models import Notification
from apps.users.models import User
from apps.tasks.models import SubmissionFile
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.tasks.models import Task
import os
from django.conf import settings
from django.http import HttpResponse, Http404, FileResponse
from openpyxl import Workbook
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.utils import timezone
from rest_framework import viewsets, status
from django.utils.text import slugify
import shutil
from apps.common import delete_file

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet

def actualize_project_statuses():
    now = timezone.now().date()

    Project.objects.filter(
        status='completed',
        end_date__lt=now
    ).update(status='archived')

class ProjectViewSet(SafeModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsTeacherOrAdminOrReadOnly]
    filterset_fields = ['status', 'semester', 'supervisor']
    search_fields = ['title', 'description', 'semester']
    ordering_fields = ['created_at', 'updated_at', 'start_date', 'end_date', 'status']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(supervisor=self.request.user)

    def get_queryset(self):
        actualize_project_statuses()

        user = self.request.user

        base_qs = Project.objects.select_related('supervisor')

        if user.role == 'admin':
            return base_qs

        if user.role == 'teacher':
            return base_qs.filter(supervisor=user)

        return base_qs.filter(members__user=user).distinct()
    
    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        user = request.user

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user

        if not (is_admin or is_supervisor):
            raise PermissionDenied('Вы не можете удалить этот проект.')

        project.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['get'])
    def gantt(self, request, pk=None):
        project = self.get_object()

        tasks = Task.objects.filter(
            project=project
        ).select_related('assignee')

        data = []

        for task in tasks:
            data.append({
                'id': task.id,
                'title': task.title,
                'start_date': task.start_date,
                'end_date': task.deadline,
                'status': task.status,
                'status_display': task.get_status_display(),
                'assignee': task.assignee.full_name if task.assignee else None,
            })

        return Response(data)
    
    @action(detail=True, methods=['get'])
    def report_excel(self, request, pk=None):
        project = self.get_object()

        wb = Workbook()
        ws = wb.active
        ws.title = 'Отчёт по проекту'

        ws.append(['Проект', project.title])
        ws.append(['Руководитель', project.supervisor.full_name])
        ws.append(['Статус', project.get_status_display()])
        ws.append(['Прогресс', f'{project.get_progress()}%'])
        ws.append([])

        ws.append(['Задача', 'Исполнитель', 'Статус', 'Дедлайн'])

        tasks = project.tasks.select_related('assignee').all()

        for task in tasks:
            ws.append([
                task.title,
                task.assignee.full_name if task.assignee else '',
                task.get_status_display(),
                task.deadline.strftime('%d.%m.%Y %H:%M') if task.deadline else '',
            ])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=project_{project.id}_report.xlsx'

        wb.save(response)
        return response
    
    @action(detail=True, methods=['get'])
    def report_pdf(self, request, pk=None):
        project = self.get_object()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=project_{project.id}_report.pdf'
        pdfmetrics.registerFont(TTFont(
            'Arial',
            'C:/Windows/Fonts/arial.ttf'
        ))
        doc = SimpleDocTemplate(response, pagesize=A4)
        styles = getSampleStyleSheet()
        styles['Title'].fontName = 'Arial'
        styles['Normal'].fontName = 'Arial'

        elements = []

        # Заголовок
        elements.append(Paragraph(f'Отчёт по проекту: {project.title}', styles['Title']))
        elements.append(Spacer(1, 12))

        elements.append(Paragraph(f'Руководитель: {project.supervisor.full_name}', styles['Normal']))
        elements.append(Paragraph(f'Статус: {project.get_status_display()}', styles['Normal']))
        elements.append(Paragraph(f'Прогресс: {project.get_progress()}%', styles['Normal']))
        elements.append(Spacer(1, 12))

        # Таблица задач
        data = [['Задача', 'Исполнитель', 'Статус', 'Дедлайн']]

        tasks = project.tasks.select_related('assignee').all()

        for task in tasks:
            data.append([
                task.title,
                task.assignee.full_name if task.assignee else '',
                task.get_status_display(),
                task.deadline.strftime('%d.%m.%Y') if task.deadline else ''
            ])

        table = Table(data)
        table.setStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 0), (-1, -1), 'Arial'),
        ])

        elements.append(table)

        doc.build(elements)

        return response
    
    @action(detail=True, methods=['get'])
    def passport_template(self, request, pk=None):
        file_path = os.path.join(
            settings.MEDIA_ROOT,
            'templates',
            'project_passport_template.xlsx'
        )

        if not os.path.exists(file_path):
            raise Http404('Файл шаблона не найден.')

        return FileResponse(
            open(file_path, 'rb'),
            as_attachment=True,
            filename='Шаблон паспорта проекта.xlsx'
        )
    
    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        project = self.get_object()
        user = request.user

        email = request.data.get('email')
        role = request.data.get('role', '')

        if not email:
            return Response(
                {'detail': 'Email обязателен.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invited_user = User.objects.filter(email=email).first()

        if invited_user:
            project_member, created = ProjectMember.objects.get_or_create(
                project=project,
                user=invited_user,
                defaults={'role': role}
            )

            if not created and role:
                project_member.role = role
                project_member.save(update_fields=['role'])

            return Response({
                'detail': 'Пользователь найден и добавлен в проект.'
            })

        ProjectInvitation.objects.update_or_create(
            project=project,
            email=email,
            defaults={
                'role': role,
                'invited_by': user,
            }
        )

        return Response({
            'detail': 'Пользователь ещё не зарегистрирован. Приглашение сохранено.'
        })


class ProjectMemberViewSet(SafeModelViewSet):
    filterset_fields = ['project', 'user', 'role']
    def get_serializer_class(self):
        if self.action == 'create':
            return AddProjectMemberSerializer

        return ProjectMemberSerializer

    def get_queryset(self):
        user = self.request.user

        qs = ProjectMember.objects.select_related('project', 'user')

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(project__supervisor=user)

        return qs.filter(project__members__user=user)
    
    def perform_create(self, serializer):
        project_member = serializer.save()

        project = project_member.project

        if project.status == 'created':
            project.status = 'active'
            project.save(update_fields=['status', 'updated_at'])

        Notification.objects.create(
            user=project_member.user,
            title='Вы добавлены в проект',
            text=f'Вы добавлены в проект "{project.title}".'
        )

    def perform_destroy(self, instance):
        user = self.request.user
        project = instance.project

        if user.role != 'admin' and project.supervisor != user:
            raise PermissionDenied('Вы не можете удалять участников из этого проекта.')

        instance.delete()

    def perform_update(self, serializer):
        member = self.get_object()
        user = self.request.user

        is_admin = user.role == 'admin'
        is_supervisor = member.project.supervisor == user

        if not (is_admin or is_supervisor):
            raise PermissionDenied('Вы не можете изменять участников проекта.')

        serializer.save()


class AttendanceViewSet(SafeModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    filterset_fields = ['project', 'student', 'date', 'status']

    def get_queryset(self):
        user = self.request.user

        qs = Attendance.objects.select_related(
            'project',
            'student',
        )

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(project__supervisor=user)

        return qs.filter(project__members__user=user).distinct()
    
    @action(detail=False, methods=['delete'], url_path='delete-date')
    def delete_date(self, request):
        project_id = request.query_params.get('project')
        date = request.query_params.get('date')

        if not project_id or not date:
            return Response(
                {'detail': 'Нужны project и date'},
                status=status.HTTP_400_BAD_REQUEST
            )

        project = Project.objects.get(id=project_id)

        if request.user.role != 'admin' and project.supervisor != request.user:
            return Response(
                {'detail': 'Нет прав на удаление этой даты'},
                status=status.HTTP_403_FORBIDDEN
            )

        Attendance.objects.filter(
            project_id=project_id,
            date=date
        ).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


def can_manage_project_file(user, project_file):
    if user.role == 'admin':
        return True

    if project_file.project.supervisor == user:
        return True

    if project_file.uploaded_by == user:
        return True

    is_teamlead = project_file.project.members.filter(
        user=user,
        role__icontains='тимлид'
    ).exists()

    return is_teamlead

class ProjectFileViewSet(SafeModelViewSet):
    serializer_class = ProjectFileSerializer
    filterset_fields = ['project', 'folder']
    search_fields = ['description', 'file']
    ordering_fields = ['uploaded_at']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        user = self.request.user

        qs = ProjectFile.objects.select_related(
            'project',
            'folder',
            'uploaded_by'
        ).filter(is_visible=True)

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(project__supervisor=user)

        return qs.filter(project__members__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        user = self.request.user

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user
        is_member = project.members.filter(user=user).exists()

        if not (is_admin or is_supervisor or is_member):
            raise PermissionDenied('Вы не можете загружать файлы в этот проект.')


        project_file = serializer.save(uploaded_by=user)

        ProjectActivity.objects.create(
            project=project,
            user=user,
            title='Новый файл проекта',
            text=f'{user.full_name or user.username} загрузил(а) файл в проект "{project.title}".'
        )

        Notification.objects.create(
            user=project.supervisor,
            title='Новый файл проекта',
            text=(
                f'{user.full_name or user.username} '
                f'загрузил(а) файл в проект "{project.title}".'
            )
        )

    def perform_update(self, serializer):
        project_file = self.get_object()

        if not can_manage_project_file(self.request.user, project_file):
            raise PermissionDenied('Вы не можете изменять этот файл.')

        old_folder_id = project_file.folder_id
        old_path = project_file.file.path if project_file.file else None

        updated_file = serializer.save()

        new_folder_id = updated_file.folder_id

        if old_folder_id == new_folder_id:
            return

        if not updated_file.file:
            return

        filename = os.path.basename(updated_file.file.name)

        if updated_file.folder and updated_file.folder.storage_path:
            new_relative_path = f'{updated_file.folder.storage_path}/{filename}'
        else:
            new_relative_path = (
                f'project_files/project_{updated_file.project_id}/root/{filename}'
            )

        new_absolute_path = os.path.join(settings.MEDIA_ROOT, new_relative_path)

        os.makedirs(os.path.dirname(new_absolute_path), exist_ok=True)

        if old_path and os.path.exists(old_path):
            shutil.move(old_path, new_absolute_path)

        updated_file.file.name = new_relative_path
        updated_file.save(update_fields=['file'])

    def destroy(self, request, *args, **kwargs):
        project_file = self.get_object()

        if not can_manage_project_file(request.user, project_file):
            raise PermissionDenied('Вы не можете удалить этот файл.')

        task = project_file.task
        source_type = project_file.source_type

        file_path = None

        if project_file.file:
            file_path = project_file.file.path

        project_file.delete()

        if file_path and os.path.exists(file_path):
            os.remove(file_path)

        if task and source_type == 'submission':
            has_submission_files = task.submissions.filter(
                files__isnull=False
            ).distinct().exists()

            if not has_submission_files:
                if task.assignee:
                    task.status = 'in_progress'
                else:
                    task.status = 'created'

                task.save(update_fields=['status', 'updated_at'])

        return Response(status=status.HTTP_204_NO_CONTENT)

class MessageViewSet(SafeModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsProjectParticipantOrAdmin]

    def get_queryset(self):
        user = self.request.user

        qs = Message.objects.select_related('project', 'author')

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(project__supervisor=user)

        return qs.filter(project__members__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        user = self.request.user

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user
        is_member = project.members.filter(user=user).exists()

        if not (is_admin or is_supervisor or is_member):
            raise PermissionDenied('Вы не можете отправлять сообщения в этом проекте.')

        serializer.save(author=user)


class IdeaViewSet(SafeModelViewSet):
    serializer_class = IdeaSerializer
    permission_classes = [IsProjectParticipantOrAdmin]

    def get_queryset(self):
        user = self.request.user

        qs = Idea.objects.select_related('project', 'author')

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(project__supervisor=user)

        return qs.filter(project__members__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        user = self.request.user

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user
        is_member = project.members.filter(user=user).exists()

        if not (is_admin or is_supervisor or is_member):
            raise PermissionDenied('Вы не можете создавать идеи в этом проекте.')

        serializer.save(author=user)

class ProjectFolderViewSet(SafeModelViewSet):
    serializer_class = ProjectFolderSerializer
    filterset_fields = ['project', 'parent']
    search_fields = ['name']
    ordering_fields = ['created_at', 'name']
    ordering = ['name']

    def get_queryset(self):
        user = self.request.user

        qs = ProjectFolder.objects.select_related(
            'project',
            'parent',
            'created_by'
        )

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(project__supervisor=user)

        return qs.filter(project__members__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        user = self.request.user

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user
        is_teamlead = project.members.filter(
            user=user,
            role__icontains='тимлид'
        ).exists()

        if not (is_admin or is_supervisor or is_teamlead):
            raise PermissionDenied('Создавать папки может только администратор, преподаватель или тимлид.')

        folder = serializer.save(created_by=user)

        folder.storage_path = (
            f'project_files/project_{folder.project_id}/folders/folder_{folder.id}'
        )

        folder.save(update_fields=['storage_path'])

        full_path = os.path.join(
            settings.MEDIA_ROOT,
            folder.storage_path
        )

        os.makedirs(full_path, exist_ok=True)

    def perform_update(self, serializer):
        folder = self.get_object()
        old_name = folder.name

        updated_folder = serializer.save()
        new_name = updated_folder.name

        if old_name == new_name:
            return

        project_id = updated_folder.project_id

        old_path = os.path.join(
            settings.MEDIA_ROOT,
            'project_files',
            f'project_{project_id}',
            'folders',
            old_name
        )

        new_path = os.path.join(
            settings.MEDIA_ROOT,
            'project_files',
            f'project_{project_id}',
            'folders',
            new_name
        )

        if os.path.exists(old_path):
            os.rename(old_path, new_path)

        for project_file in updated_folder.files.all():
            filename = os.path.basename(project_file.file.name)
            project_file.file.name = (
                f'project_files/project_{project_id}/folders/{new_name}/{filename}'
            )
            project_file.save(update_fields=['file'])
    
    def destroy(self, request, *args, **kwargs):
        folder = self.get_object()
        user = request.user
        project = folder.project

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user

        if not (is_admin or is_supervisor):
            raise PermissionDenied('Вы не можете удалить эту папку.')

        files = folder.files.all()

        for project_file in files:
            if project_file.file:
                delete_file(project_file.file.path)
            project_file.delete()

        if folder.storage_path:
            folder_path = os.path.join(
                settings.MEDIA_ROOT,
                folder.storage_path
            )

            if os.path.exists(folder_path):
                shutil.rmtree(folder_path)

        folder.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

class MeetingViewSet(SafeModelViewSet):
    serializer_class = MeetingSerializer
    filterset_fields = ['project']
    search_fields = ['title']
    ordering_fields = ['scheduled_at', 'created_at']
    ordering = ['scheduled_at']

    def get_queryset(self):
        user = self.request.user

        qs = Meeting.objects.select_related(
            'project',
            'created_by'
        )

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(project__supervisor=user)

        return qs.filter(project__members__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        user = self.request.user

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user
        is_member = project.members.filter(user=user).exists()

        if not (is_admin or is_supervisor or is_member):
            raise PermissionDenied('Вы не можете создавать созвоны в этом проекте.')

        serializer.save(created_by=user)

class ProjectActivityViewSet(SafeModelViewSet):
    serializer_class = ProjectActivitySerializer
    filterset_fields = ['project']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user

        qs = ProjectActivity.objects.select_related(
            'project',
            'user'
        )

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(project__supervisor=user)

        return qs.filter(project__members__user=user).distinct()

class ProjectChatMessageViewSet(SafeModelViewSet):
    serializer_class = ProjectChatMessageSerializer
    filterset_fields = ['project']

    def get_queryset(self):
        user = self.request.user

        qs = ProjectChatMessage.objects.select_related(
            'project',
            'author'
        )

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(project__supervisor=user)

        return qs.filter(project__members__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        user = self.request.user

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user
        is_member = project.members.filter(user=user).exists()

        if not (is_admin or is_supervisor or is_member):
            raise PermissionDenied('Вы не можете писать в чат этого проекта.')

        serializer.save(author=user)