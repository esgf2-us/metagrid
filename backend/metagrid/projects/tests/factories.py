import factory


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.Project"
        django_get_or_create = ("name",)


class FacetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.Facet"
        django_get_or_create = ("name",)
