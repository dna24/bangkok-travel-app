from rest_framework import serializers
from .models import User
from .models import Place
from .models import TravelMemo
from .models import MemoImage
from .models import Review
from .models import ReviewImage
from .models import FavPlace
from .models import Report
from .models import PlacesRecommend
from .models import Plans
from .models import PlanPlace
from .models import Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'user_name', 'user_email', 'password', 'user_img', 'user_birthday', 'user_gender','last_login','is_active','is_staff']
        extra_kwargs = {
            'password': {'write_only': True}  # ซ่อนรหัสผ่านจาก response
        }

class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = '__all__'

class MemoImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemoImage
        fields = ['memo_img']

class TravelMemoSerializer(serializers.ModelSerializer):
    images = MemoImageSerializer(many=True, required=False)

    class Meta:
        model = TravelMemo
        fields = ['memo_id', 'memo_type', 'memo_detail', 'user_id', 'place_id', 'images']

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        travel_memo = TravelMemo.objects.create(**validated_data)
        for image_data in images_data:
            MemoImage.objects.create(travel_memo=travel_memo, **image_data)
        return travel_memo
        
class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['review_img']

class ReviewSerializer(serializers.ModelSerializer):
    images = ReviewImageSerializer(many=True, required=False)

    class Meta:
        model = Review
        fields = ['review_id', 'review_rate', 'review_detail', 'review_status', 'user_id', 'place_id', 'images']

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        review = Review.objects.create(**validated_data)
        for image_data in images_data:
            ReviewImage.objects.create(review=review, **image_data)
        return review
    
class FavPlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavPlace
        fields = ['fav_id', 'user_id', 'place_id']

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'

class PlacesRecommendSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacesRecommend
        fields = '__all__'

class PlansSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField() 

    class Meta:
        model = Plans
        fields = '__all__' 

    def get_duration(self, obj):
        return (obj.enddate - obj.startdate).days + 1 

class PlanPlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanPlace
        fields = '__all__'  

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_name', 'user_email', 'password', 'user_img', 'user_birthday', 'user_gender']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

        