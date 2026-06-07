from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.tasks.models import Task, Submission
from apps.users.models import Notification


class Command(BaseCommand):
    help = 'Проверяет просроченные задачи и создаёт уведомления'

    def check_overdue_tasks():
        now = timezone.now()

        tasks = Task.objects.filter(
            deadline__lt=now
        ).exclude(
            status__in=['accepted', 'overdue']
        )

        for task in tasks:
            has_submission = Submission.objects.filter(
                task=task
            ).exists()

            if has_submission:
                continue

            task.status = 'overdue'
            task.save()

            if task.assignee:
                Notification.objects.create(
                    user=task.assignee,
                    title='Задача просрочена',
                    text=f'Задача "{task.title}" просрочена.'
                )

            Notification.objects.create(
                user=task.project.supervisor,
                title='Просрочена задача',
                text=f'Задача "{task.title}" просрочена.'
            )