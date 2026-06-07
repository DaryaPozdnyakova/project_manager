from apps.common import SafeModelViewSet
from apps.projects.models import ProjectMember
from apps.tasks.models import Grade
from django.db.models import Count

from .models import User, Notification
from .serializers import UserSerializer, NotificationSerializer, RegisterSerializer, CreateStudentSerializer

from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from apps.projects.models import Project
from apps.tasks.models import Task
from apps.tasks.models import ProjectFile
from apps.projects.models import Meeting
from apps.users.models import User
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode



class UserViewSet(SafeModelViewSet):
    serializer_class = UserSerializer
    search_fields = ['username', 'email', 'full_name']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return User.objects.all()

        if user.role == 'teacher':
            return User.objects.filter(
                project_memberships__project__supervisor=user
            ).distinct()

        return User.objects.filter(
            project_memberships__project__members__user=user
        ).distinct()
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if request.method == 'PATCH':
            serializer = self.get_serializer(
                request.user,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user

        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password_repeat = request.data.get('new_password_repeat')

        if not user.check_password(old_password):
            return Response(
                {'detail': 'Старый пароль введён неверно.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != new_password_repeat:
            return Response(
                {'detail': 'Новые пароли не совпадают.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response(
                {'detail': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({'detail': 'Пароль успешно изменён.'})


class NotificationViewSet(SafeModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        

        if user.role == 'admin':
            return Notification.objects.all()

        return Notification.objects.filter(user=user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()

        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        user = request.user

        if user.role == 'admin':
            queryset = Notification.objects.all()
        else:
            queryset = Notification.objects.filter(user=user)

        queryset.update(is_read=True)

        return Response({'detail': 'Все уведомления отмечены как прочитанные.'})

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response(
            {'detail': 'Вы успешно вышли из системы.'},
            status=status.HTTP_205_RESET_CONTENT
        )

class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class CreateStudentView(CreateAPIView):
    serializer_class = CreateStudentSerializer

    def get_permissions(self):
        if self.request.user.role in ['teacher', 'admin']:
            return []

        from rest_framework.permissions import IsAdminUser
        return [IsAdminUser()]

class PasswordResetAPIView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')

        form = PasswordResetForm({'email': email})

        if form.is_valid():
            form.save(
                request=request,
                use_https=False,
                subject_template_name='registration/password_reset_subject.txt',
                email_template_name='registration/password_reset_email.html',
            )

        return Response({
            'detail': 'Письмо отправлено'
        })

class PasswordResetConfirmAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uid or not token or not new_password:
            return Response(
                {'detail': 'Недостаточно данных.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = get_user_model().objects.get(pk=user_id)
        except Exception:
            return Response(
                {'detail': 'Некорректная ссылка.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Ссылка устарела или недействительна.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({'detail': 'Пароль изменён.'})

class AdminMetricsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            raise PermissionDenied('Доступ только для администратора.')

        total_projects = Project.objects.count()
        completed_projects = Project.objects.filter(status='completed').count()
        archived_projects = Project.objects.filter(status='archived').count()
        active_projects = Project.objects.exclude(status__in=['completed', 'archived']).count()

        return Response({
            'users': {
                'total': User.objects.count(),
                'students': User.objects.filter(role='student').count(),
                'teachers': User.objects.filter(role='teacher').count(),
                'admins': User.objects.filter(role='admin').count(),
            },
            'activity': {
                'projects': total_projects,
                'tasks': Task.objects.count(),
                'active_tasks': Task.objects.exclude(status__in=['accepted', 'rejected']).count(),
                'files': ProjectFile.objects.count(),
                'meetings': Meeting.objects.count(),
            },
            'projects': {
                'total': total_projects,
                'active': active_projects,
                'completed': completed_projects,
                'archived': archived_projects,
            },
        })

class TeacherTaskControlAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != 'teacher':
            raise PermissionDenied('Доступ только для преподавателя.')

        teacher_projects = Project.objects.filter(supervisor=user)

        tasks = Task.objects.filter(project__in=teacher_projects)

        return Response({
            'summary': {
                'projects': teacher_projects.count(),
                'total_tasks': tasks.count(),
                'in_progress': tasks.filter(status='in_progress').count(),
                'review': tasks.filter(status='review').count(),
                'overdue': tasks.filter(status='overdue').count(),
                'without_assignee': tasks.filter(assignee__isnull=True).count(),
            }
        })