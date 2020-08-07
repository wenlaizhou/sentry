from __future__ import absolute_import

from django.db import IntegrityError, transaction
from rest_framework import serializers

from sentry.api.base import DocSection
from sentry.api.bases.organization import OrganizationEndpoint
from sentry.api.paginator import OffsetPaginator
from sentry.api.serializers.models.organization_dashboard import DashboardIndexSerializer
from sentry.api.serializers import serialize
from sentry.models import Dashboard, ObjectStatus
from rest_framework.response import Response


class DashboardSerializer(serializers.Serializer):
    title = serializers.CharField(required=True)


class OrganizationDashboardsEndpoint(OrganizationEndpoint):
    doc_section = DocSection.ORGANIZATIONS

    def get(self, request, organization):
        """
        Retrieve an Organizations Dashboards
        `````````````````````````````````````
        Retrieve a list of dashboards that are associated with the given organization.
        :pparam string organization_slug: the slug of the organization the
                                          dashboards belongs to.
        :qparam string query: the title of the dashboard being searched for.
        :auth: required
        """
        dashboards = Dashboard.objects.filter(
            organization_id=organization.id,
            status=ObjectStatus.ACTIVE
        )
        query = request.GET.get("query")
        if query:
            dashboards = dashboards.filter(title__icontains=query)

        serializer = DashboardIndexSerializer()
        return self.paginate(
            request=request,
            queryset=dashboards,
            order_by="title",
            paginator_cls=OffsetPaginator,
            on_results=lambda x: serialize(x, request.user, serializer=serializer),
        )

    def post(self, request, organization):
        """
        Create a New Dashboard for an Organization
        ``````````````````````````````````````````
        Create a new dashboard for the given Organization
        :pparam string organization_slug: the slug of the organization the
                                          dashboards belongs to.
        :param string title: the title of the dashboard.
        """
        serializer = DashboardSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        result = serializer.validated_data

        try:
            with transaction.atomic():
                dashboard = Dashboard.objects.create(
                    organization_id=organization.id, title=result["title"], created_by=request.user
                )
        except IntegrityError:
            return Response("This dashboard already exists", status=409)

        serializer = DashboardIndexSerializer()
        return Response(serialize(dashboard, request.user, serializer=serializer), status=201)
