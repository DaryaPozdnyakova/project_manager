from rest_framework import serializers

from .models import Task, SubTask, Submission, SubmissionFile, Comment, TaskHistory, Grade
from django.utils import timezone

class SubmissionFileSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = SubmissionFile
        fields = [
            'id',
            'submission',
            'file',
            'file_url',
            'file_name',
            'uploaded_at',
        ]

    def get_file_url(self, obj):
        if obj.project_file and obj.project_file.file:
            request = self.context.get('request')
            url = obj.project_file.file.url
            return request.build_absolute_uri(url) if request else url

        return None

    def get_file_name(self, obj):
        project_file = obj.project_file

        if not project_file:
            return ''

        if project_file.display_name:
            return project_file.display_name

        if project_file.file:
            return project_file.file.name.split('/')[-1]

        return ''


class SubmissionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    checked_by_name = serializers.CharField(source='checked_by.full_name', read_only=True)
    review_status_display = serializers.CharField(source='get_review_status_display', read_only=True)
    files = SubmissionFileSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id',
            'task',
            'task_title',
            'student',
            'student_name',
            'text_answer',
            'link',
            'file',
            'grade',
            'teacher_comment',
            'review_status',
            'review_status_display',
            'checked_by',
            'checked_by_name',
            'submitted_at',
            'checked_at',
            'publish_to_project_files',
            'target_folder',
            'files',
        ]
        read_only_fields = (
            'student', 'checked_at',
        )

    def validate(self, attrs):
        request = self.context.get('request')

        if not request:
            return attrs

        user = request.user

        if user.role == 'student':
            forbidden_fields = [
                'grade',
                'teacher_comment',
                'review_status',
                'checked_by',
            ]

            for field in forbidden_fields:
                if field in attrs:
                    raise serializers.ValidationError({
                        field: 'Студент не может изменять это поле.'
                    })

        return attrs
    
    def perform_update(self, serializer):
        submission = serializer.save()

        if self.request.user.role in ['teacher', 'admin']:
            submission.checked_by = self.request.user
            submission.checked_at = timezone.now()
            submission.save(update_fields=['checked_by', 'checked_at'])

            task = submission.task

            if submission.review_status == 'accepted':
                task.status = 'accepted'
                task.save(update_fields=['status', 'updated_at'])

            elif submission.review_status == 'rejected':
                task.status = 'rejected'
                task.save(update_fields=['status', 'updated_at'])


class TaskSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    assignee_name = serializers.CharField(source='assignee.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    last_submission_at = serializers.SerializerMethodField()
    submissions = SubmissionSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'project',
            'project_title',
            'title',
            'description',
            'assignee',
            'assignee_name',
            'created_by',
            'created_by_name',
            'status',
            'status_display',
            'deadline',
            'start_date',
            'last_submission_at',
            'created_at',
            'updated_at',
            'is_open_for_self_assign',
            'submissions',
            'self_assigned',
        ]

        read_only_fields = (
            'created_by',
            'created_at',
            'updated_at',
        )

    def get_last_submission_at(self, obj):
        submission = obj.submissions.order_by('-submitted_at').first()

        if not submission:
            return None

        return submission.submitted_at


class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = '__all__'


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id',
            'task',
            'task_title',
            'author',
            'author_name',
            'text',
            'parent',
            'replies',
            'created_at',
        ]
        read_only_fields = ('author', 'created_at')

    def get_replies(self, obj):
        replies = obj.replies.select_related('author').all()
        return CommentSerializer(replies, many=True).data

class TaskHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskHistory
        fields = '__all__'


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.full_name', read_only=True)
    semester_display = serializers.CharField(source='get_semester_display', read_only=True)
    grade_type_display = serializers.CharField(source='get_grade_type_display', read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id',
            'student',
            'student_name',
            'project',
            'project_title',
            'task',
            'task_title',
            'reason',
            'value',
            'comment',
            'graded_by',
            'graded_by_name',
            'created_at',
            'semester',
            'semester_display',
            'graded_at',
            'grade_type',
            'grade_type_display',
        ]

    def validate(self, attrs):
        request = self.context.get('request')

        if not request:
            return attrs

        user = request.user

        if user.role not in ['teacher', 'admin']:
            raise serializers.ValidationError(
                'Оценку может выставлять только преподаватель или администратор.'
            )

        project = attrs.get('project')

        if user.role == 'teacher' and project and project.supervisor != user:
            raise serializers.ValidationError({
                'project': 'Преподаватель может выставлять оценки только по своим проектам.'
            })

        return attrs

