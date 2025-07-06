
from django.shortcuts import render
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import logout
from django.contrib.auth.hashers import check_password
from django.utils.timezone import now
from django.db import models
from django.db.models import Avg
from rest_framework import viewsets
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly,AllowAny
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.parsers import FormParser
from rest_framework import generics
from django.views.decorators.csrf import csrf_exempt
from django.db import models
from django.db.models import Avg

from django.core.files.base import ContentFile
import base64
import json
import math

from .serializers import UserSerializer
from .serializers import PlaceSerializer
from .serializers import TravelMemoSerializer
from .serializers import ReviewSerializer
from .serializers import FavPlaceSerializer
from .serializers import ReportSerializer
from .serializers import PlacesRecommendSerializer
from .serializers import PlansSerializer
from .serializers import PlanPlaceSerializer
from .serializers import NotificationSerializer
from .serializers import RegisterSerializer

from .models import User
from .models import Place
from .models import TravelMemo
from .models import Review
from .models import FavPlace
from .models import Report
from .models import PlacesRecommend
from .models import Plans
from .models import PlanPlace
from .models import Notification
from .models import MemoImage
from .models import ReviewImage

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] 

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        # ตรวจสอบว่าผู้ใช้ที่ล็อกอินมีสิทธิ์ลบผู้ใช้อื่น
        if request.user != user and not request.user.is_staff:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        self.perform_destroy(user)
        return Response({"message": "Account deleted successfully"}, status=status.HTTP_200_OK)
    def update(self, request, *args, **kwargs):
        user = self.get_object()

        # ตรวจสอบว่าผู้ใช้ที่ล็อกอินสามารถแก้ไขเฉพาะโปรไฟล์ของตัวเอง
        if request.user != user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        request.data['last_login'] = now()

        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], url_path='change-password')
    def change_password(self, request, pk=None):
        user = self.get_object()

        if request.user != user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if new_password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)

class PlaceViewSet(viewsets.ModelViewSet):
    queryset = Place.objects.all()
    serializer_class = PlaceSerializer

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True  # อนุญาตให้แก้ไขบางฟิลด์โดยไม่ต้องส่งค่าทั้งหมด
        return super().update(request, *args, **kwargs)

class TravelMemoViewSet(viewsets.ModelViewSet):
    queryset = TravelMemo.objects.all()
    serializer_class = TravelMemoSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer


class FavPlaceViewSet(viewsets.ModelViewSet):
    serializer_class = FavPlaceSerializer
    queryset = FavPlace.objects.all() 
    permission_classes = [IsAuthenticated]

    # ค้นหาข้อมูลรายการโปรดของผู้ใช้ปัจจุบัน
    def get_queryset(self):
        user = self.request.user
        return FavPlace.objects.filter(user_id=user)

    # เพิ่มสถานที่เข้าไปในรายการโปรด
    @action(detail=False, methods=['POST'])
    def add_fav(self, request):
        user = request.user
        place_id = request.data.get('place_id')
        if not place_id:
            return Response({"error": "Place ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        fav, created = FavPlace.objects.get_or_create(user_id=user, place_id=place_id)
        if created:
            return Response({"message": "Added to favorites"}, status=status.HTTP_201_CREATED)
        return Response({"message": "Already in favorites"}, status=status.HTTP_200_OK)

    # ลบสถานที่ออกจากรายการโปรด
    @action(detail=True, methods=['DELETE'])
    def remove_fav(self, request, pk=None):
        user = request.user
        try:
            fav = FavPlace.objects.get(user_id=user, place_id=pk)
            fav.delete()
            return Response({"message": "Removed from favorites"}, status=status.HTTP_204_NO_CONTENT)
        except FavPlace.DoesNotExist:
            return Response({"error": "Favorite not found"}, status=status.HTTP_404_NOT_FOUND)

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

class PlacesRecommendViewSet(viewsets.ModelViewSet):
    queryset = PlacesRecommend.objects.all()
    serializer_class = PlacesRecommendSerializer

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True  # อนุญาตให้แก้ไขบางฟิลด์โดยไม่ต้องส่งค่าทั้งหมด
        return super().update(request, *args, **kwargs)

class PlansViewSet(viewsets.ModelViewSet):
    queryset = Plans.objects.all()
    serializer_class = PlansSerializer

class PlanPlaceViewSet(viewsets.ModelViewSet):
    queryset = PlanPlace.objects.all()
    serializer_class = PlanPlaceSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

# ---------------------------------- login user

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('user_email')
        password = request.data.get('password')
        
        print(f"Received email: {email}, password: {password}")  

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(user_email=email)
            if check_password(password, user.password):  
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh_token': str(refresh),
                    'access_token': str(refresh.access_token)
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
   
# ---------------------------------- api google
import requests

def autocomplete(request):
    input_text = request.GET.get("input", "")
    if not input_text:
        return JsonResponse({"predictions": []})

    url = f"https://maps.googleapis.com/maps/api/place/autocomplete/json"
    params = {
        "input": input_text,
        "key": settings.GOOGLE_MAPS_API_KEY,
        "types": "establishment", 
    }
    
    response = requests.get(url, params=params)
    print("Google API Response:", response.json())
    return JsonResponse(response.json())

@api_view(["GET"])
def place_details(request):
    place_id = request.GET.get("place_id", "")
    if not place_id:
        return JsonResponse({"error": "Place ID is required"}, status=400)

    url = f"https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,geometry,formatted_phone_number,website,opening_hours",
        "language": "th",
        "key": settings.GOOGLE_MAPS_API_KEY
    }

    response = requests.get(url, params=params)
    return JsonResponse(response.json())

# ---------------------------------- api user list
class UserListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        place_id = request.query_params.get("place_id")
        if place_id:
            user_ids = Review.objects.filter(place_id=place_id).values_list('user_id', flat=True).distinct()
            users = User.objects.filter(id__in=user_ids)
        else:
            users = User.objects.all()
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
# ---------------------------------- api submit review
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])  # รองรับไฟล์ภาพ
def submit_review(request):
    try:
        review_data = {
            'review_rate': request.data.get('review_rate'),
            'review_detail': request.data.get('review_detail'),
            'user_id': request.data.get('user_id'),
            'place_id': request.data.get('place_id'),
        }

        serializer = ReviewSerializer(data=review_data)
        if serializer.is_valid():
            review = serializer.save()  # บันทึกรีวิวก่อน

            # ตรวจสอบว่ามีไฟล์ภาพอัปโหลดมาหรือไม่
            if 'images' in request.FILES:
                images = request.FILES.getlist('images')
                for image_file in images:
                    ReviewImage.objects.create(review=review, review_img=image_file)  # บันทึกภาพ

            return Response({'message': 'Review submitted successfully'}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ---------------------------------- api memo list create
class TravelMemoListCreateView(generics.ListCreateAPIView):
    queryset = TravelMemo.objects.all()
    serializer_class = TravelMemoSerializer

    def get_queryset(self):
        memo_type = self.request.query_params.get('type', None)
        user_id = self.request.query_params.get('user_id', None)
        queryset = self.queryset
        if memo_type:
            queryset = queryset.filter(memo_type=memo_type)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset

# ---------------------------------- api submit
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def submit_memo(request):
    try:
        memo_data = {
            'memo_type': request.data.get('memo_type'),
            'memo_detail': request.data.get('memo_detail'),
            'user_id': request.data.get('user_id'),
            'place_id': request.data.get('place_id'),
        }

        # สร้าง Memo ใหม่
        serializer = TravelMemoSerializer(data=memo_data)
        if serializer.is_valid():
            travel_memo = serializer.save()

            if 'images' in request.FILES:
                images = request.FILES.getlist('images')
                for image_file in images:
                    MemoImage.objects.create(travel_memo=travel_memo, memo_img=image_file)

            return Response({'message': 'Memo submitted successfully'}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ---------------------------------- api search places
def search_places(request):
    query = request.GET.get('query', '')
    print(f"Query received: {query}")

    if query:
        places = Place.objects.filter(place_name__icontains=query)
        print(f"Places found: {places}")
    else:
        places = Place.objects.none()
    
    serializer = PlaceSerializer(places, many=True)
    return JsonResponse({'places': serializer.data})

# ---------------------------------- api delete memo
class DeleteMemoView(APIView):
    def delete(self, request, memo_id):
        try:
            memo = TravelMemo.objects.get(pk=memo_id)

            memo.images.all().delete()
            memo.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        except TravelMemo.DoesNotExist:
            return Response({"error": "Memo not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
      
# ---------------------------------- api register
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# ---------------------------------- api get directions
@api_view(['GET'])
def get_directions(request):
    origin = request.GET.get('origin')
    destination = request.GET.get('destination')
    waypoints = request.GET.getlist('waypoints')

    if not origin or not destination:
        return Response({"error": "Missing required parameters"}, status=400)

    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": origin,
        "destination": destination,
        "key": settings.GOOGLE_MAPS_API_KEY
    }

    if waypoints:
        params["waypoints"] = "|".join(waypoints)

    try:
        response = requests.get(url, params=params)
        response.raise_for_status() 
        return Response(response.json())
    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=500)
    
# ----------------------knn-------------
 
def calculate_euclidean_distance(user1, user2):
     # ตรวจสอบการมีวันเกิดสำหรับผู้ใช้ทั้งสอง
     if user1.user_birthday and user2.user_birthday:
        age_diff = abs(user1.user_birthday.year - user2.user_birthday.year)
     else:
        age_diff = 0  # ถ้าข้อมูลวันเกิดไม่มี ให้คิดว่าไม่มีความแตกต่าง
 
     gender_diff = 0 if user1.user_gender == user2.user_gender else 1
     return math.sqrt(age_diff**2 + gender_diff**2)
 
def recommend_places(request, user_id, k=10):
    # ดึงข้อมูลผู้ใช้เป้าหมาย
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

    # ดึงข้อมูลผู้ใช้ทั้งหมดที่ไม่ใช่ staff
    all_users = User.objects.filter(is_staff=False).exclude(id=user_id)
    print(f"Total users for comparison: {all_users.count()}")

    # คำนวณระยะห่างระหว่างผู้ใช้เป้าหมายกับผู้ใช้อื่น ๆ
    distances = []
    for user in all_users:
        dist = calculate_euclidean_distance(target_user, user)
        distances.append((user, dist))

    # เรียงตามระยะห่างจากน้อยไปหามาก
    distances.sort(key=lambda x: x[1])

    # เลือกผู้ใช้ที่ใกล้เคียงที่สุด k คน
    nearest_users = [user for user, _ in distances[:k]]

    # ค้นหาสถานที่ที่ได้รับคะแนนรีวิวสูงจากผู้ใช้ที่ใกล้เคียง
    places = []
    for user in nearest_users:
        # ดึงข้อมูลรีวิวของผู้ใช้คนนี้
        user_reviews = Review.objects.filter(user_id=user)
        for review in user_reviews:
            place = review.place_id
            if place not in places:
                places.append(place)

    # คำนวณคะแนนรีวิวเฉลี่ยของสถานที่
    place_scores = []
    for place in places:
        reviews = Review.objects.filter(place_id=place)
        avg_score = reviews.aggregate(Avg('review_rate'))['review_rate__avg']
        place_scores.append((place, avg_score))

    # เรียงตามคะแนนสูงสุด
    place_scores.sort(key=lambda x: x[1], reverse=True)

    # เลือก 5 สถานที่ที่มีคะแนนสูงสุด
    recommended_places = [place for place, _ in place_scores[:5]]

    # แปลงข้อมูลสถานที่ให้เป็นรูปแบบ JSON
    recommended_places_data = [
        {
            "place_id": place.place_id,
            "place_name": place.place_name,
            "place_img": place.place_img.url if place.place_img else None,  # Get the image URL
            "avg_rating": avg_score,  
        }
        for place, avg_score in place_scores[:5]
    ]
    print(f"found: {recommended_places_data}")

    return JsonResponse({'recommended_places': recommended_places_data})
 
# ---------------------------------- api create plan
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_plan(request):
    try:
        plan_name = request.data.get('plan_name')
        startdate = request.data.get('startdate')
        enddate = request.data.get('enddate')
        user_id = request.data.get('user_id')
        place_ids = request.data.get('place_ids', [])

        if not plan_name or not startdate or not enddate or not user_id:
            return JsonResponse({'error': 'กรุณากรอกข้อมูลให้ครบถ้วน'}, status=400)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({'error': 'ไม่พบผู้ใช้ที่ระบุ'}, status=400)

        new_plan = Plans.objects.create(
            plan_name=plan_name,
            startdate=startdate,
            enddate=enddate,
            user_id=user
        )

        plan_places = []
        for place_id in place_ids:
            try:
                place = Place.objects.get(place_id=place_id)
                plan_places.append(PlanPlace(plan_id=new_plan, place_id=place))
            except Place.DoesNotExist:
                return JsonResponse({'error': f'ไม่พบสถานที่ที่ ID {place_id}'}, status=400)

        if plan_places:
            PlanPlace.objects.bulk_create(plan_places)
        return JsonResponse({'message': 'สร้างแผนสำเร็จ', 'plan_id': new_plan.plan_id}, status=201)
    
    except Exception as e:
        return JsonResponse({'error': 'เกิดข้อผิดพลาด', 'details': str(e)}, status=400)

#----------------------------------- api update plan
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_plan(request, plan_id):
    try:
        plan = Plans.objects.get(plan_id=plan_id)
    except Plans.DoesNotExist:
        return JsonResponse({'error': 'ไม่พบแผนการเดินทางที่ระบุ'}, status=404)

    # ตรวจสอบว่าเป็นผู้ใช้งานที่เป็นเจ้าของแผนการเดินทาง
    if plan.user_id != request.user:
        return JsonResponse({'error': 'คุณไม่มีสิทธิ์แก้ไขแผนการเดินทางนี้'}, status=403)

    plan_name = request.data.get('plan_name')
    startdate = request.data.get('startdate')
    enddate = request.data.get('enddate')
    place_ids = request.data.get('place_ids', [])

    if not plan_name or not startdate or not enddate:
        return JsonResponse({'error': 'กรุณากรอกข้อมูลให้ครบถ้วน'}, status=400)

    # อัปเดตข้อมูลแผนการเดินทาง
    plan.plan_name = plan_name
    plan.startdate = startdate
    plan.enddate = enddate
    plan.save()

    # ลบสถานที่เดิมที่มีในแผนการเดินทาง
    PlanPlace.objects.filter(plan_id=plan).delete()

    # เพิ่มสถานที่ใหม่
    plan_places = []
    for place_id in place_ids:
        try:
            place = Place.objects.get(place_id=place_id)
            plan_places.append(PlanPlace(plan_id=plan, place_id=place))
        except Place.DoesNotExist:
            return JsonResponse({'error': f'ไม่พบสถานที่ที่ ID {place_id}'}, status=400)

    if plan_places:
        PlanPlace.objects.bulk_create(plan_places)

    return JsonResponse({'message': 'อัปเดตแผนการเดินทางสำเร็จ', 'plan_id': plan.plan_id}, status=200)

# ---------------chart------------------

@api_view(['GET'])
def popular_places_stats(request):
    reviews = Review.objects.filter(review_status='approved').select_related('place_id', 'user_id')

    place_data = {}
    for review in reviews:
        place = review.place_id  
        user = review.user_id  
        if not place or not user:
            continue

        if place.id not in place_data:
            place_data[place.id] = {
                'place_name': place.place_name,
                'total': 0,
                'count': 0,
                'male': {'total': 0, 'count': 0},
                'female': {'total': 0, 'count': 0}
            }

        place_data[place.id]['total'] += review.review_rate
        place_data[place.id]['count'] += 1

        if user.user_gender == 'ชาย':
            place_data[place.id]['male']['total'] += review.review_rate
            place_data[place.id]['male']['count'] += 1
        elif user.user_gender == 'หญิง':
            place_data[place.id]['female']['total'] += review.review_rate
            place_data[place.id]['female']['count'] += 1

    def calc_weighted(total, count):
        return (total / count) * math.log10(count + 1) if count > 0 else 0

    result = []
    for data in place_data.values():
        result.append({
            'place_name': data['place_name'],
            'weighted_score': calc_weighted(data['total'], data['count']),
            'male_score': calc_weighted(data['male']['total'], data['male']['count']),
            'female_score': calc_weighted(data['female']['total'], data['female']['count']),
        })

    sorted_all = sorted(result, key=lambda x: x['weighted_score'], reverse=True)
    sorted_male = sorted(result, key=lambda x: x['male_score'], reverse=True)
    sorted_female = sorted(result, key=lambda x: x['female_score'], reverse=True)

    return Response({
        'top_all': sorted_all[:10],
        'top_male': sorted_male[:3],
        'top_female': sorted_female[:3]
    })

@api_view(['GET'])
def popular_plan_places(request):
    planplaces = PlanPlace.objects.select_related('plan_id', 'place_id')  
    plans = Plans.objects.select_related('user_id')  
    users = {p.user_id.id: p.user_id for p in plans if p.user_id}

    place_count = {}
    male_count = {}
    female_count = {}

    for pp in planplaces:
        place = pp.place_id  
        plan = pp.plan_id 
        if not place or not plan:
            continue
        user = users.get(plan.user_id.id)  
        if not user:
            continue

        place_name = place.place_name
        place_count[place_name] = place_count.get(place_name, 0) + 1
        if user.user_gender == 'ชาย':
            male_count[place_name] = male_count.get(place_name, 0) + 1
        elif user.user_gender == 'หญิง':
            female_count[place_name] = female_count.get(place_name, 0) + 1

    def top(data, limit):
        return sorted(
            [{'place_name': k, 'count': v} for k, v in data.items()],
            key=lambda x: x['count'],
            reverse=True
        )[:limit]

    return Response({
        'top_all': top(place_count, 10),
        'top_male': top(male_count, 3),
        'top_female': top(female_count, 3)
    })
#---------------report----------------
class ReportWithDetailsView(APIView):
    def get(self, request):
        reports = Report.objects.filter(report_status="wait")
        result = []

        for report in reports:
            memo = report.memo_id  
            memo_user = memo.user_id if memo else None
            place = memo.place_id if memo else None
            user = report.user_id

            user_img_url = memo_user.user_img.url if memo_user and memo_user.user_img else None
            if user_img_url:
                user_img_url = request.build_absolute_uri(user_img_url)
                
            print("User Image URL:", user_img_url)  
            result.append({
                "report_id": report.report_id,
                "report_type": report.report_type,
                "report_detail": report.report_detail,
                "report_status": report.report_status,
                "user": UserSerializer(user).data if user else None,
                "memo": TravelMemoSerializer(memo).data if memo else None,
                "memo_user": UserSerializer(memo_user).data if memo_user else None,
                "place": PlaceSerializer(place).data if place else None,
                "user_img_url": user_img_url,  
            })

        return Response(result)
#---------------review----------------
class ReviewWithDetailsView(APIView):
    def get(self, request):
        reviews = Review.objects.filter(review_status="wait")
        results = []

        for review in reviews:
            user = review.user_id
            place = review.place_id
            images = review.images.all()

            user_data = UserSerializer(user).data if user else None
            if user and user.user_img:
                user_data["user_img"] = request.build_absolute_uri(user.user_img.url)
            else:
                user_data["user_img"] = None

            results.append({
                "review_id": review.review_id,
                "review_rate": review.review_rate,
                "review_detail": review.review_detail,
                "review_status": review.review_status,
                "user": user_data,
                "place": PlaceSerializer(place).data if place else None,
                "images": [
                    {
                        "review_img": request.build_absolute_uri(img.review_img.url)
                        if img.review_img else None
                    }
                    for img in images
                ]
            })

        return Response(results)
