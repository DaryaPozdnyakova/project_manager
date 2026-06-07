from apps.common import SafeModelViewSet
from apps.permissions import IsTeacherOrAdminOrReadOnly, IsSubmissionOwnerOrTeacherOrAdmin
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from apps.users.models import Notification
from apps.projects.models import ProjectActivity
from rest_framework.permissions import IsAuthenticated
from apps.projects.models import ProjectFile

from .models import Task, SubTask, Submission, SubmissionFile, Comment, TaskHistory, Grade, ProjectFile
from .serializers import (
    TaskSerializer,
    SubTaskSerializer,
    SubmissionSerializer,
    CommentSerializer,
    TaskHistorySerializer,
    GradeSerializer,
    SubmissionFileSerializer,
)

def actualize_overdue_tasks(queryset):
    now = timezone.now()

    overdue_tasks = queryset.filter(
        deadline__lt=now,
    ).exclude(
        status__in=['accepted', 'review', 'overdue']
    )

    for task in overdue_tasks:
        has_submission = Submission.objects.filter(task=task).exists()

        if not has_submission:
            task.status = 'overdue'
            task.save(update_fields=['status', 'updated_at'])

class TaskViewSet(SafeModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['project', 'status', 'assignee']
    search_fields = ['title', 'description']
    ordering_fields = ['deadline', 'created_at', 'updated_at', 'status']
    ordering = ['deadline']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            qs = Task.objects.select_related('project', 'assignee', 'created_by')

        elif user.role == 'teacher':
            qs = Task.objects.filter(
                project__supervisor=user
            ).select_related('project', 'assignee', 'created_by')

        else:
            qs = Task.objects.filter(
                project__members__user=user
            ).select_related('project', 'assignee', 'created_by').distinct()

        actualize_overdue_tasks(qs)

        return qs

    def perform_create(self, serializer):
        project = serializer.validated_data.get('project')
        user = self.request.user

        is_admin = user.role == 'admin'
        is_teacher = project.supervisor == user
        is_teamlead = project.members.filter(
            user=user,
            role='Тимлид',
        ).exists()

        if not (is_admin or is_teacher or is_teamlead):
            raise PermissionDenied('Вы не можете создавать задачи в этом проекте.')

        task = serializer.save(created_by=user)

        if task.assignee and task.status == 'created':
            task.status = 'in_progress'
            task.self_assigned = False
            task.save(update_fields=['status', 'self_assigned', 'updated_at'])

            Notification.objects.create(
                user=task.assignee,
                title='Вам назначена задача',
                text=f'Вам назначена задача: {task.title}'
            )

    def perform_update(self, serializer):
        old_task = self.get_object()

        old_deadline = old_task.deadline
        old_assignee = old_task.assignee
        old_status = old_task.status

        task = serializer.save()

        if task.is_open_for_self_assign:
            task.assignee = None
            task.self_assigned = False
            task.status = 'created'
            task.save(update_fields=[
                'assignee',
                'self_assigned',
                'status',
                'updated_at',
            ])

            if old_assignee:
                Notification.objects.create(
                    user=old_assignee,
                    title='Вы сняты с задачи',
                    text=f'Задача "{task.title}" теперь доступна для самостоятельного выбора.'
                )

            return

        if task.assignee and task.status == 'created':
            task.status = 'in_progress'
            task.save(update_fields=['status', 'updated_at'])

        if old_assignee != task.assignee:
            task.self_assigned = False

            update_fields = ['self_assigned', 'updated_at']

            if old_assignee and not task.assignee and old_status == 'in_progress':
                task.status = 'created'
                update_fields.append('status')

            task.save(update_fields=update_fields)

            if task.assignee:
                Notification.objects.create(
                    user=task.assignee,
                    title='Вам назначена задача',
                    text=f'Вам назначена задача: {task.title}'
                )

        if old_deadline != task.deadline and task.assignee:
            Notification.objects.create(
                user=task.assignee,
                title='Изменён срок задачи',
                text=f'У задачи "{task.title}" изменён срок выполнения.'
            )

        if old_status != task.status and task.assignee:
            Notification.objects.create(
                user=task.assignee,
                title='Изменён статус задачи',
                text=f'У задачи "{task.title}" изменён статус.'
            )

    def get_permissions(self):
        if self.action in ['self_assign', 'cancel_self_assign']:
            return [IsAuthenticated()]

        return [permission() for permission in self.permission_classes]

    @action(detail=True, methods=['post'])
    def self_assign(self, request, pk=None):
        task = self.get_object()
        user = request.user
        project = task.project

        if user.role != 'student':
            raise PermissionDenied('Только студент может взять задачу.')

        if not project.members.filter(user=user).exists():
            raise PermissionDenied('Вы не участник этого проекта.')

        if not task.is_open_for_self_assign:
            raise ValidationError('Эту задачу нельзя взять самостоятельно.')

        if task.assignee:
            raise ValidationError('У задачи уже есть исполнитель.')

        task.assignee = user
        task.self_assigned = True
        task.status = 'in_progress'
        task.save(update_fields=['assignee', 'self_assigned', 'status', 'updated_at'])

        Notification.objects.create(
            user=project.supervisor,
            title='Задача взята',
            text=f'{user.full_name or user.username} взял(а) задачу "{task.title}".'
        )

        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel_self_assign(self, request, pk=None):
        task = self.get_object()
        user = request.user
        project = task.project

        if user.role != 'student':
            raise PermissionDenied('Только студент может отказаться от задачи.')

        if task.assignee != user or not task.self_assigned:
            raise PermissionDenied('Можно отказаться только от задачи, которую вы взяли самостоятельно.')

        task.assignee = None
        task.self_assigned = False
        task.status = 'created'
        task.save(update_fields=['assignee', 'self_assigned', 'status', 'updated_at'])

        Notification.objects.create(
            user=project.supervisor,
            title='Студент отказался от задачи',
            text=f'{user.full_name or user.username} отказался(лась) от задачи "{task.title}".'
        )

        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        user = request.user
        project = task.project

        is_admin = user.role == 'admin'
        is_teacher = project.supervisor == user
        is_teamlead = project.members.filter(
            user=user,
            role='Тимлид'
        ).exists()

        if not (is_admin or is_teacher or is_teamlead):
            raise PermissionDenied('Вы не можете удалить эту задачу.')

        task.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

class SubTaskViewSet(SafeModelViewSet):
    queryset = SubTask.objects.all()
    serializer_class = SubTaskSerializer


class SubmissionViewSet(SafeModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [IsSubmissionOwnerOrTeacherOrAdmin]
    filterset_fields = ['task', 'student', 'review_status', 'grade']
    ordering_fields = ['submitted_at', 'checked_at', 'grade']
    ordering = ['-submitted_at']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return Submission.objects.select_related('task', 'student', 'checked_by', 'task__project')

        if user.role == 'teacher':
            return Submission.objects.filter(
                task__project__supervisor=user
            ).select_related('task', 'student', 'checked_by', 'task__project')

        return Submission.objects.filter(
            task__project__members__user=user
        ).select_related(
            'task',
            'student',
            'checked_by',
            'task__project'
        ).distinct()
    
    def perform_create(self, serializer):
        task = serializer.validated_data['task']
        user = self.request.user
        project = task.project

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user
        is_member = project.members.filter(user=user).exists()

        if not (is_admin or is_supervisor or is_member):
            raise PermissionDenied('Вы не можете сдавать задание в этом проекте.')

        answer_owner = task.assignee or user

        submission = serializer.save(student=answer_owner)

        task.status = 'review'
        task.save(update_fields=['status', 'updated_at'])

        ProjectActivity.objects.create(
            project=project,
            user=user,
            title='Новая сдача задания',
            text=f'{answer_owner.full_name or answer_owner.username} сдал(а) задание "{task.title}" на проверку.'
        )
            
    def perform_update(self, serializer):
        submission = self.get_object()
        user = self.request.user
        task = submission.task

        answer_owner = task.assignee or submission.student

        is_review_action = any(
            field in self.request.data
            for field in ['review_status', 'grade', 'teacher_comment']
        )

        if user.role == 'student':
            if task.assignee != user and submission.student != user:
                raise PermissionDenied('Вы можете изменять только свой ответ.')

            submission = serializer.save(student=answer_owner)

            submission.review_status = 'pending'
            submission.checked_by = None
            submission.checked_at = None
            submission.grade = None
            submission.teacher_comment = ''
            submission.save(update_fields=[
                'student',
                'review_status',
                'checked_by',
                'checked_at',
                'grade',
                'teacher_comment',
            ])

            task.status = 'review'
            task.save(update_fields=['status', 'updated_at'])

        elif user.role in ['teacher', 'admin']:
            submission = serializer.save(student=answer_owner)

            if is_review_action:
                submission.checked_by = user
                submission.checked_at = timezone.now()
                submission.save(update_fields=[
                    'student',
                    'checked_by',
                    'checked_at',
                    'review_status',
                    'grade',
                    'teacher_comment',
                ])

                if submission.review_status == 'accepted':
                    task.status = 'accepted'

                    ProjectFile.objects.filter(
                        submission=submission,
                        source_type='submission',
                    ).update(is_visible=True)

                elif submission.review_status == 'rejected':
                    task.status = 'rejected'

                    ProjectFile.objects.filter(
                        submission=submission,
                        source_type='submission',
                    ).update(is_visible=False)

                task.save(update_fields=['status', 'updated_at'])

                if submission.grade is not None:
                    Grade.objects.update_or_create(
                        project=task.project,
                        task=task,
                        student=answer_owner,
                        defaults={
                            'value': submission.grade,
                            'comment': submission.teacher_comment,
                            'graded_by': user,
                            'semester': get_semester_by_date(timezone.now()),
                            'grade_type': 'regular',
                        }
                    )
            else:
                submission.review_status = 'pending'
                submission.checked_by = None
                submission.checked_at = None
                submission.grade = None
                submission.teacher_comment = ''
                submission.save(update_fields=[
                    'student',
                    'review_status',
                    'checked_by',
                    'checked_at',
                    'grade',
                    'teacher_comment',
                ])

                task.status = 'review'
                task.save(update_fields=['status', 'updated_at'])

        ProjectActivity.objects.create(
            project=task.project,
            user=user,
            title='Ответ изменён',
            text=f'{user.full_name or user.username} изменил(а) ответ по задаче "{task.title}".'
        )

        Notification.objects.create(
            user=submission.task.project.supervisor,
            title='Ответ обновлён',
            text=(
                f'{submission.student.full_name or submission.student.username} '
                f'изменил(а) ответ по задаче "{submission.task.title}".'
            )
        )
        
    def perform_destroy(self, instance):
        Notification.objects.create(
            user=instance.task.project.supervisor,
            title='Ответ удалён',
            text=(
                f'{instance.student.full_name or instance.student.username} '
                f'удалил(а) ответ по задаче "{instance.task.title}".'
            )
        )

        ProjectFile.objects.filter(
            submission=instance,
            source_type='submission',
        ).delete()

        instance.delete()

    def destroy(self, request, *args, **kwargs):
        submission = self.get_object()
        user = request.user
        project = submission.task.project
        task = submission.task

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user
        is_owner = submission.student == user

        if not (is_admin or is_supervisor or is_owner):
            raise PermissionDenied('Вы не можете удалить этот ответ.')

        response = super(SafeModelViewSet, self).destroy(request, *args, **kwargs)

        if task.assignee:
            task.status = 'in_progress'
        else:
            task.status = 'created'

        task.save(update_fields=['status', 'updated_at'])

        return response
    
    


class CommentViewSet(SafeModelViewSet):
    serializer_class = CommentSerializer
    filterset_fields = ['task', 'parent']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return Comment.objects.select_related('task', 'author', 'task__project')

        if user.role == 'teacher':
            return Comment.objects.filter(
                task__project__supervisor=user
            ).select_related('task', 'author', 'task__project')

        return Comment.objects.filter(
            task__project__members__user=user
        ).select_related('task', 'author', 'task__project').distinct()
    
    def perform_create(self, serializer):
        task = serializer.validated_data['task']
        user = self.request.user
        project = task.project

        is_admin = user.role == 'admin'
        is_supervisor = project.supervisor == user
        is_member = project.members.filter(user=user).exists()

        if not (is_admin or is_supervisor or is_member):
            raise PermissionDenied('Вы не можете оставлять комментарии к этой задаче.')
    
        comment = serializer.save(author=self.request.user)

        ProjectActivity.objects.create(
            project=project,
            user=user,
            title='Новый комментарий',
            text=f'{user.full_name or user.username} оставил(а) комментарий к задаче "{task.title}".'
        )

        Notification.objects.create(
            user=task.project.supervisor,
            title='Новый комментарий',
            text=(
                f'{user.full_name or user.username} '
                f'оставил(а) комментарий к задаче "{task.title}".'
            )
        )

    def can_manage_comment(self, comment):
        user = self.request.user

        if user.role == 'admin':
            return True

        if comment.task.project.supervisor == user:
            return True

        if comment.author == user:
            return True

        return False

    def perform_update(self, serializer):
        comment = self.get_object()

        if not self.can_manage_comment(comment):
            raise PermissionDenied('Вы не можете изменять этот комментарий.')

        serializer.save()

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()

        if not self.can_manage_comment(comment):
            raise PermissionDenied('Вы не можете удалить этот комментарий.')

        return super(SafeModelViewSet, self).destroy(request, *args, **kwargs)


class TaskHistoryViewSet(SafeModelViewSet):
    queryset = TaskHistory.objects.all()
    serializer_class = TaskHistorySerializer


class GradeViewSet(SafeModelViewSet):
    serializer_class = GradeSerializer
    permission_classes = [IsTeacherOrAdminOrReadOnly]
    filterset_fields = ['student', 'project', 'task', 'value', 'reason', 'semester', 'grade_type']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return Grade.objects.select_related(
                'student',
                'project',
                'task',
                'graded_by',
            )

        if user.role == 'teacher':
            return Grade.objects.filter(
                project__supervisor=user
            ).select_related(
                'student',
                'project',
                'task',
                'graded_by',
            )

        return Grade.objects.filter(
            student=user
        ).select_related(
            'student',
            'project',
            'task',
            'graded_by',
        )

    def perform_create(self, serializer):
        task = serializer.validated_data.get('task')
        student = serializer.validated_data.get('student')

        if task and task.assignee:
            student = task.assignee

        serializer.save(
            student=student,
            graded_by=self.request.user
        )

    def perform_update(self, serializer):
        task = serializer.validated_data.get('task', serializer.instance.task)
        student = serializer.validated_data.get('student', serializer.instance.student)

        if task and task.assignee:
            student = task.assignee

        grade = serializer.save(
            student=student,
            graded_by=self.request.user
        )

        if grade.task:
            submission = Submission.objects.filter(
                task=grade.task,
                student=grade.student
            ).order_by('-submitted_at').first()

            if submission:
                submission.grade = grade.value
                submission.teacher_comment = grade.comment
                submission.checked_by = self.request.user
                submission.checked_at = timezone.now()
                submission.save(update_fields=[
                    'grade',
                    'teacher_comment',
                    'checked_by',
                    'checked_at',
                ])
    
    def destroy(self, request, *args, **kwargs):
        grade = self.get_object()
        user = request.user
        project = grade.project

        is_admin = user.role == 'admin'
        is_teacher = project.supervisor == user

        if not (is_admin or is_teacher):
            raise PermissionDenied('Вы не можете удалить эту оценку.')

        grade.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


def submission_is_empty(submission):
    has_text = bool(submission.text_answer and submission.text_answer.strip())
    has_link = bool(submission.link and submission.link.strip())
    has_old_file = bool(submission.file)
    has_files = submission.files.exists()

    return not (has_text or has_link or has_old_file or has_files)

def get_semester_by_date(date):
    if date.month in [9, 10, 11, 12, 1]:
        return 'autumn'

    return 'spring'

class SubmissionFileViewSet(SafeModelViewSet):
    serializer_class = SubmissionFileSerializer

    def get_queryset(self):
        user = self.request.user

        qs = SubmissionFile.objects.select_related(
            'submission',
            'submission__task',
            'submission__task__project',
            'submission__student'
        )

        if user.role == 'admin':
            return qs

        if user.role == 'teacher':
            return qs.filter(submission__task__project__supervisor=user)

        return qs.filter(submission__student=user)
    
    def perform_create(self, serializer):
        submission = serializer.validated_data['submission']
        uploaded_file = serializer.validated_data.pop('file')
        user = self.request.user

        task = submission.task
        project = task.project

        project_file = ProjectFile.objects.create(
            project=project,
            folder=None,
            uploaded_by=user,
            file=uploaded_file,
            description=f'Файл ответа на задачу "{task.title}"',
            source_type='submission',
            is_visible=False,
            submission=submission,
            task=task,
        )

        serializer.save(
            project_file=project_file
        )
    
    def destroy(self, request, *args, **kwargs):
        submission_file = self.get_object()
        project_file = submission_file.project_file

        if project_file:
            project_file.delete()
        else:
            submission_file.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)