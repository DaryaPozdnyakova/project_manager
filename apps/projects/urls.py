from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ProjectViewSet,
    ProjectMemberViewSet,
    AttendanceViewSet,
    ProjectFileViewSet,
    MessageViewSet,
    IdeaViewSet,
    ProjectFolderViewSet,
    MeetingViewSet,
    ProjectActivityViewSet,
    ProjectChatMessageViewSet,
)


router = DefaultRouter()

router.register('projects', ProjectViewSet, basename='projects')
router.register('project-members', ProjectMemberViewSet, basename='project-members')
router.register('attendance', AttendanceViewSet)
router.register('project-files', ProjectFileViewSet, basename='project-files')
router.register('messages', MessageViewSet, basename='messages')
router.register('ideas', IdeaViewSet, basename='ideas')
router.register('project-folders', ProjectFolderViewSet, basename='project-folders')
router.register('meetings', MeetingViewSet, basename='meetings')
router.register('project-activities', ProjectActivityViewSet, basename='project-activities')
router.register('project-chat-messages', ProjectChatMessageViewSet, basename='project-chat-messages')

urlpatterns = [
    path('', include(router.urls)),
]