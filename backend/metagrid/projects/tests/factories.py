import factory


class FacetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.Facet"
        django_get_or_create = ("name",)

    name = factory.Faker("job")


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.Project"
        django_get_or_create = ("name",)

    name = factory.Faker("company")
    facets = factory.RelatedFactory(FacetFactory, "project")


class FacetGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.FacetGroup"
        django_get_or_create = ("name",)

    name = factory.Faker("job")
    description = "description"
