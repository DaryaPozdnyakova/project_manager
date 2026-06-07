from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User, Notification


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('Дополнительная информация', {
            'fields': ('role', 'full_name', 'group_number')
        }),
    )

    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ('Дополнительная информация', {
            'fields': ('role', 'full_name')
        }),
    )

    list_display = ('username', 'full_name', 'email', 'role','group_number', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'full_name', 'email')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('title', 'text', 'user__username', 'user__full_name')