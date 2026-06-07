from rest_framework import viewsets
from rest_framework.exceptions import MethodNotAllowed
import os


class SafeModelViewSet(viewsets.ModelViewSet):
    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed('DELETE')

def delete_file(path):
    if path and os.path.isfile(path):
        os.remove(path)