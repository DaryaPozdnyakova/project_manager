from rest_framework import serializers

from .models import User, Notification
from apps.projects.models import ProjectInvitation, ProjectMember


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'role',
            'group_number',
            'is_active',
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'title',
            'text',
            'is_read',
            'created_at',
        ]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'group_number',
            'password',
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data.get('full_name', ''),
            group_number=validated_data.get('group_number', ''),
            password=validated_data['password'],
            role='student'
        )

        invitations = ProjectInvitation.objects.filter(email=user.email)

        for invitation in invitations:
            ProjectMember.objects.get_or_create(
                project=invitation.project,
                user=user,
                defaults={
                    'role': invitation.role
                }
            )

        invitations.delete()

        return user
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Пользователь с таким email уже существует.')

        return value


class CreateStudentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'password',
        ]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            full_name=validated_data.get('full_name', ''),
            password=validated_data['password'],
            role='student'
        )