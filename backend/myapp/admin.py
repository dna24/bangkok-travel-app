from django.contrib import admin
from django.contrib.auth.hashers import make_password, is_password_usable

# Register your models here.
from myapp.models import User
from myapp.models import Place
from myapp.models import TravelMemo
from myapp.models import MemoImage
from myapp.models import Review
from myapp.models import ReviewImage
from myapp.models import FavPlace
from myapp.models import Report
from myapp.models import PlacesRecommend
from myapp.models import Plans
from myapp.models import PlanPlace
from myapp.models import Notification

from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin

class UserAdmin(DefaultUserAdmin):
    model = User
    list_display = ('user_name', 'user_email', 'is_staff', 'is_active')
    search_fields = ('user_email', 'user_name')
    ordering = ('user_email',)

    fieldsets = (
        (None, {'fields': ('user_name', 'user_email', 'password')}),
        ('Personal info', {'fields': ('user_gender', 'user_birthday', 'user_img')}),
        ('Permissions', {'fields': ('is_active', 'is_staff')}),
        ('Important dates', {'fields': ('last_login',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('user_name', 'user_email', 'password1', 'password2', 'is_staff', 'is_active'),
        }),
    )
    def save_model(self, request, obj, form, change):
        print('save_model ถูกเรียกใช้ 🚀')
        
        raw_password = obj.password  
        print('raw_password:', raw_password)
        
        if not is_password_usable(raw_password):  # เช็คว่ารหัสผ่านยังไม่ถูกเข้ารหัส
            obj.set_password(raw_password)
            print(f'🔐 รหัสผ่านหลังเข้ารหัส: {obj.password}')
    
        super().save_model(request, obj, form, change)  # บันทึกลงฐานข้อมูล

admin.site.register(User, UserAdmin)
admin.site.register(Place)
admin.site.register(TravelMemo)
admin.site.register(MemoImage)
admin.site.register(Review)
admin.site.register(ReviewImage)
admin.site.register(FavPlace)
admin.site.register(Report)
admin.site.register(PlacesRecommend)
admin.site.register(Plans)
admin.site.register(PlanPlace)
admin.site.register(Notification)