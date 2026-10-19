from rest_framework import serializers
from .models import patient

class useSerializers(serializers.ModelSerializer):
    class Meta:
        model=patient
        fields ="__all__"
        extra_kwargs={'password':{'write_only':True}}