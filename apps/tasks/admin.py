from django.contrib import admin
from .models import Task, SubTask, Submission, Comment, TaskHistory, Grade

class CommentInline(admin.TabularInline):
    model = Comment
    extra = 1

class TaskHistoryInline(admin.TabularInline):
    model = TaskHistory
    extra = 0
    readonly_fields = ('changed_by', 'field_name', 'old_value', 'new_value', 'changed_at')
    can_delete = False

class SubTaskInline(admin.TabularInline):
    model = SubTask
    extra = 1

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'assignee', 'status', 'deadline')
    list_filter = ('status', 'project')
    search_fields = ('title', 'description')
    inlines = [SubTaskInline, CommentInline, TaskHistoryInline]

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('task', 'student', 'grade', 'submitted_at', 'checked_at')
    list_filter = ('grade', 'submitted_at')
    search_fields = ('task__title', 'student__username', 'student__full_name')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'author', 'created_at')
    search_fields = ('text', 'author__username')

@admin.register(TaskHistory)
class TaskHistoryAdmin(admin.ModelAdmin):
    list_display = ('task', 'field_name', 'old_value', 'new_value', 'changed_by', 'changed_at')
    list_filter = ('field_name', 'changed_at')
    search_fields = ('task__title', 'field_name', 'old_value', 'new_value')

@admin.register(SubTask)
class SubTaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'task', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('title', 'description', 'task__title')

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'project', 'task', 'value', 'graded_by', 'created_at')
    list_filter = ('project', 'value', 'created_at')
    search_fields = ('student__username', 'student__full_name', 'task__title')

