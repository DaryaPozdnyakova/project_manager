from rest_framework import serializers

from .models import Project, ProjectMember, Attendance, ProjectFile, Message, Idea, ProjectFolder, Meeting, ProjectActivity, ProjectChatMessage, ProjectInvitation


class ProjectSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    supervisor_name = serializers.CharField(source='supervisor.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id',
            'title',
            'description',
            'semester',
            'start_date',
            'end_date',
            'status',
            'status_display',
            'supervisor',
            'supervisor_name',
            'progress',
            'created_at',
            'updated_at',
        ]

    def get_progress(self, obj):
        return obj.get_progress()


class ProjectMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_role_display = serializers.CharField(source='user.get_role_display', read_only=True)
    user_group_number = serializers.CharField(source='user.group_number', read_only=True)


    class Meta:
        model = ProjectMember
        fields = [
            'id',
            'project',
            'user',
            'user_name',
            'user_email',
            'user_role',
            'user_role_display',
            'role',
            'user_group_number',
            'joined_at',
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = [
            'id',
            'project',
            'student',
            'date',
            'status',
            'comment',
        ]

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id',
            'project',
            'author',
            'text',
            'created_at',
        ]


class IdeaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = [
            'id',
            'project',
            'author',
            'title',
            'description',
            'status',
            'created_at',
        ]

class AddProjectMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMember
        fields = [
            'id',
            'project',
            'user',
            'role',
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        project = attrs.get('project')

        if user.role == 'admin':
            return attrs

        if user.role == 'teacher' and project.supervisor == user:
            return attrs

        raise serializers.ValidationError(
            'Добавлять участников может только руководитель проекта или администратор.'
        )

class ProjectFileSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    folder_name = serializers.CharField(source='folder.name', read_only=True)

    class Meta:
        model = ProjectFile
        fields = [
            'id',
            'project',
            'project_title',
            'folder',
            'folder_name',
            'uploaded_by',
            'uploaded_by_name',
            'file',
            'description',
            'access_level',
            'uploaded_at',
            'display_name',
        ]
        read_only_fields = ('uploaded_by', 'uploaded_at')

class ProjectFolderSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = ProjectFolder
        fields = [
            'id',
            'project',
            'project_title',
            'name',
            'parent',
            'parent_name',
            'created_by',
            'created_by_name',
            'created_at',
        ]
        read_only_fields = ('created_by', 'created_at')

class MeetingSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id',
            'project',
            'project_title',
            'title',
            'meeting_url',
            'scheduled_at',
            'created_by',
            'created_by_name',
            'created_at',
        ]
        read_only_fields = ('created_by', 'created_at')

class ProjectActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = ProjectActivity
        fields = [
            'id',
            'project',
            'user',
            'user_name',
            'title',
            'text',
            'created_at',
        ]
        read_only_fields = ('user', 'created_at')

class ProjectChatMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_email = serializers.EmailField(source='author.email', read_only=True)

    class Meta:
        model = ProjectChatMessage
        fields = [
            'id',
            'project',
            'author',
            'author_name',
            'author_email',
            'text',
            'created_at',
        ]
        read_only_fields = ('author', 'created_at')

class ProjectInvitationSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.full_name', read_only=True)

    class Meta:
        model = ProjectInvitation
        fields = [
            'id',
            'project',
            'project_title',
            'email',
            'role',
            'invited_by',
            'invited_by_name',
            'created_at',
        ]
        read_only_fields = ('invited_by', 'created_at')