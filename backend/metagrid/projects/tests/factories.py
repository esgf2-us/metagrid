import factory


class FacetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.Facet"
        django_get_or_create = ("name",)

    name = factory.Faker("job")


class FacetGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.FacetGroup"
        django_get_or_create = ("name",)

    name = factory.Faker("job")
    description = "description"


class ProjectFacetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.ProjectFacet"

    group = factory.SubFactory(FacetGroupFactory)
    facet = factory.SubFactory(FacetFactory)


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.Project"
        django_get_or_create = ("name",)

    name = factory.Faker("company")
    facets = factory.RelatedFactory(ProjectFacetFactory, "project")
