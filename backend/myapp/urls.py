from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import UserViewSet
from .views import PlaceViewSet
from .views import TravelMemoViewSet
from .views import ReviewViewSet
from .views import FavPlaceViewSet
from .views import ReportViewSet
from .views import PlacesRecommendViewSet
from .views import PlansViewSet
from .views import PlanPlaceViewSet
from .views import NotificationViewSet
from .views import LoginView
from .views import UserListView
from .views import TravelMemoListCreateView
from .views import DeleteMemoView
from .views import RegisterView
from .views import ReportWithDetailsView
from .views import ReviewWithDetailsView
from .views import submit_review
from .views import submit_memo
from .views import search_places
from .views import autocomplete
from .views import place_details
from .views import get_directions
from .views import recommend_places 
from .views import create_plan
from .views import update_plan
from .views import popular_places_stats
from .views import popular_plan_places


router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'places', PlaceViewSet)
router.register(r'travel_memos', TravelMemoViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'favplaces', FavPlaceViewSet)
router.register(r'reports', ReportViewSet)
router.register(r'placesrecommend', PlacesRecommendViewSet)
router.register(r'plans', PlansViewSet)
router.register(r'planplaces', PlanPlaceViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("autocomplete/", autocomplete, name="autocomplete"),
    path("place_details/", place_details, name="place_details"),
    path('login_user/', LoginView.as_view(), name='login'),
    path('users_list/', UserListView.as_view(), name='user-list'),
    path('submit_review/', submit_review, name="submit_review"),
    path('memos/', TravelMemoListCreateView.as_view(), name='memo-list-create'),
    path('submit_memo/', submit_memo, name='submit-memo'),
    path('search_places/', search_places, name='search-places'),
    path('memo/<int:memo_id>/', DeleteMemoView.as_view(), name='delete-memo'),
    path('register/', RegisterView.as_view(), name='register'),
    path('directions/', get_directions, name='get_directions'),
    path('recommend-places/<int:user_id>/', recommend_places, name='recommend_places'),
    path('create_plan/', create_plan, name='create_plan'),
    path('update_plan/<int:plan_id>/', update_plan, name='update_plan'),
    path('stats/popular/', popular_places_stats),
    path('stats/plan/', popular_plan_places),
    path('report/with-details/', ReportWithDetailsView.as_view(), name='report-with-details'),
    path("review-details/", ReviewWithDetailsView.as_view(), name="review-details"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)