from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    TaskViewSet,
    SubTaskViewSet,
    SubmissionViewSet,
    CommentViewSet,
    TaskHistoryViewSet,
    GradeViewSet,
    SubmissionFileViewSet,
)


router = DefaultRouter()

router.register('tasks', TaskViewSet, basename='tasks')
router.register('subtasks', SubTaskViewSet)
router.register('submissions', SubmissionViewSet, basename='submissions')
router.register('comments', CommentViewSet, basename='comments')
router.register('task-history', TaskHistoryViewSet)
router.register('grades', GradeViewSet, basename='grades')
router.register('submission-files', SubmissionFileViewSet, basename='submission-files')


urlpatterns = [
    path('', include(router.urls)),
]