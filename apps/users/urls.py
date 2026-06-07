from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import UserViewSet, NotificationViewSet, LogoutView, RegisterView, CreateStudentView
from .views import PasswordResetAPIView
from .views import PasswordResetAPIView, PasswordResetConfirmAPIView
from .views import AdminMetricsAPIView
from .views import TeacherTaskControlAPIView

router = DefaultRouter()

router.register('users', UserViewSet, basename='users')
router.register('notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('students/create/', CreateStudentView.as_view(), name='create-student'),
    path('admin-metrics/', AdminMetricsAPIView.as_view()),
    path('teacher-task-control/', TeacherTaskControlAPIView.as_view()),
    path(
        'password-reset/',
        PasswordResetAPIView.as_view(),
    ),
    path(
        'password-reset-confirm/',
        PasswordResetConfirmAPIView.as_view(),
    ),
]