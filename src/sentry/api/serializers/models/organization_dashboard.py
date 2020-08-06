from __future__ import absolute_import

import six

from sentry.api.serializers import Serializer, register, serialize
from sentry.api.serializers.models.user import UserSerializer
from sentry.models import Dashboard, Widget, WidgetDisplayTypes
from sentry.discover.models import DiscoverSavedQuery


@register(Widget)
class WidgetSerializer(Serializer):
    def get_attrs(self, item_list, user):
        result = {}
        queries = serialize(
            list(DiscoverSavedQuery.objects.filter(id__in=[i.saved_query_id for i in item_list]))
        )
        query_map = {query["id"]: query for query in queries}

        for widget in item_list:
            result[widget] = {"savedQuery": query_map[six.text_type(widget.saved_query_id)]}

        return result

    def serialize(self, obj, attrs, user, **kwargs):
        return {
            "id": six.text_type(obj.id),
            "order": obj.order,
            "title": obj.title,
            "displayType": WidgetDisplayTypes.get_type_name(obj.display_type),
            "displayOptions": obj.display_options,
            "dateCreated": obj.date_added,
            "dashboardId": six.text_type(obj.dashboard_id),
            "savedQuery": attrs["savedQuery"],
        }


@register(Dashboard)
class DashboardSerializer(Serializer):
    def get_attrs(self, item_list, user):
        result = {}
        widgets = serialize(list(Widget.objects.filter(dashboard_id__in=[i.id for i in item_list]).order_by('order')))

        for dashboard in item_list:
            dashboard_widgets = [
                w for w in widgets if w["dashboardId"] == six.text_type(dashboard.id)
            ]
            result[dashboard] = {"widgets": dashboard_widgets}

        return result

    def serialize(self, obj, attrs, user, **kwargs):
        data = {
            "id": six.text_type(obj.id),
            "title": obj.title,
            "dateCreated": obj.date_added,
            "createdBy": serialize(obj.created_by, serializer=UserSerializer()),
            "widgets": attrs["widgets"],
        }
        return data


class DashboardIndexSerializer(Serializer):
    def serialize(self, obj, attrs, user, **kwargs):
        data = {
            "id": six.text_type(obj.id),
            "title": obj.title,
            "dateCreated": obj.date_added,
            "createdBy": serialize(obj.created_by, serializer=UserSerializer()),
        }
        return data
