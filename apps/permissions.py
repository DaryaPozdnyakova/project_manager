from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.role == 'admin'


class IsTeacherOrAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.role in ['teacher', 'admin']

class IsSubmissionOwnerOrTeacherOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True

        if request.user.role == 'teacher':
            return obj.task.project.supervisor == request.user

        return obj.student == request.user or obj.task.assignee == request.user

class IsProjectParticipantOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == 'admin':
            return True

        if obj.project.supervisor == user:
            return True

        return obj.project.members.filter(user=user).exists()