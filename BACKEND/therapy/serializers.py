from rest_framework import serializers
from .models import patients

class useSerialisers(serializers.ModelSerializer):
    class meta:
        model=patients
        fields="_all_"