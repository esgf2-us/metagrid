from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Retrieve a setting value"

    def add_arguments(self, parser):
        parser.add_argument("setting_name", type=str)

    def handle(self, *args, **options):
        setting_name = options["setting_name"]
        try:
            setting_value = getattr(settings, setting_name)
            self.stdout.write(f"{setting_name}: {setting_value}")
        except AttributeError:
            self.stderr.write(f"Setting '{setting_name}' not found.")
