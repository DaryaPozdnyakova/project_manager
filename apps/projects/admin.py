from django.contrib import admin
from .models import Project, ProjectMember, Attendance, ProjectFile, Message, Idea, ProjectFolder, Meeting, ProjectChatMessage


class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'supervisor', 'status', 'semester', 'progress', 'created_at')
    list_filter = ('status', 'semester')
    search_fields = ('title', 'description')
    inlines = [ProjectMemberInline]

    def progress(self, obj):
        return f'{obj.get_progress()}%'

    progress.short_description = 'Прогресс'

@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ('project', 'user', 'role', 'joined_at')
    list_filter = ('role',)
    search_fields = ('project__title', 'user__username', 'user__full_name')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('project', 'student', 'date', 'status')
    list_filter = ('project', 'status', 'date')
    search_fields = ('student__username', 'student__full_name', 'project__title')

@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_display = ('project', 'uploaded_by', 'access_level', 'uploaded_at')
    list_filter = ('project', 'access_level', 'uploaded_at')
    search_fields = ('project__title', 'description', 'uploaded_by__username')

@admin.register(ProjectChatMessage)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('project', 'author', 'created_at')
    list_filter = ('project', 'created_at')
    search_fields = ('text', 'author__username', 'author__full_name', 'project__title')

@admin.register(Idea)
class IdeaAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'author', 'status', 'created_at')
    list_filter = ('project', 'status', 'created_at')
    search_fields = ('title', 'description', 'author__username')

@admin.register(ProjectFolder)
class ProjectFolderAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'parent', 'created_by', 'created_at')
    list_filter = ('project', 'created_at')
    search_fields = ('name', 'project__title', 'created_by__username', 'created_by__full_name')

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'scheduled_at', 'created_by')
    list_filter = ('project', 'scheduled_at')
    search_fields = ('title', 'project__title', 'created_by__username')