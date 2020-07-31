from __future__ import absolute_import

from django.db.models import Max
from rest_framework import serializers

from sentry.api.serializers.rest_framework import JSONField, ValidationError
from sentry.models import Widget, WidgetDisplayTypes
from sentry.discover.models import DiscoverSavedQuery


def get_next_dashboard_order(dashboard_id):
    max_order = Widget.objects.filter(dashboard_id=dashboard_id).aggregate(Max("order"))[
        "order__max"
    ]

    return max_order + 1 if max_order else 1


class WidgetSerializer(serializers.Serializer):
    displayType = serializers.CharField(required=True)
    displayOptions = JSONField(required=False)
    title = serializers.CharField(required=True)
    saved_query_id = serializers.IntegerField(required=True)

    def validate_displayType(self, display_type):
        if display_type not in WidgetDisplayTypes.TYPE_NAMES:
            raise ValidationError("Widget displayType %s not recognized." % display_type)

        return WidgetDisplayTypes.get_id_for_type_name(display_type)

    def validate_saved_query_id(self, query_id):
        organization = self.context['organization']
        saved_query = DiscoverSavedQuery.objects.filter(
            organization=organization,
            id=query_id
        )
        if not saved_query.exists():
            raise ValidationError("Invalid saved query.")
        return query_id
