from django.db import models
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.timezone import now


class UserManager(BaseUserManager):
    def create_user(self, user_email, user_name, password=None, **extra_fields):
        if not user_email:
            raise ValueError('The Email field must be set')
        user_email = self.normalize_email(user_email)
        user = self.model(user_email=user_email, user_name=user_name, **extra_fields)
        user.set_password(password)  # ใช้ set_password เพื่อเข้ารหัสรหัสผ่าน
        user.save(using=self._db)
        return user

    def create_superuser(self, user_email, user_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('is_staff'):
            raise ValueError('Superuser must have is_staff=True.')
        if not extra_fields.get('is_superuser'):
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(user_email, user_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    GENDER_CHOICES = [
        ('ชาย', 'ชาย'),
        ('หญิง', 'หญิง'),
        ('อื่นๆ', 'อื่นๆ'),
    ]

    id = models.AutoField(primary_key=True)
    user_name = models.CharField(max_length=50)
    user_email = models.EmailField(max_length=50, unique=True)
    password = models.CharField(max_length=128) 
    user_img = models.ImageField(blank=True, null=True,upload_to='user_images/', default='user_images/default.png')  
    user_birthday = models.DateField(blank=True, null=True,)
    user_gender = models.CharField(blank=True, null=True,max_length=10, choices=GENDER_CHOICES)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login = models.DateTimeField(blank=True, null=True, default=now)

    USERNAME_FIELD = 'user_email'
    REQUIRED_FIELDS = ['user_name']

    objects = UserManager()

    def __str__(self):
        return self.user_name

class Place(models.Model):
    PLACE_TYPE_CHOICES = [
        ('พิพิธภัณฑ์ศิลปะ', 'พิพิธภัณฑ์ศิลปะ'),
        ('พิพิธภัณฑ์ประวัติศาสตร์', 'พิพิธภัณฑ์ประวัติศาสตร์'),
        ('พิพิธภัณฑ์วิทยาศาสตร์', 'พิพิธภัณฑ์วิทยาศาสตร์'),
        ('พิพิธภัณฑ์ธรรมชาติวิทยา', 'พิพิธภัณฑ์ธรรมชาติวิทยา'),
        ('พิพิธภัณฑ์วัฒนธรรม', 'พิพิธภัณฑ์วัฒนธรรม'),
        ('พิพิธภัณฑ์สัตว์น้ำ', 'พิพิธภัณฑ์สัตว์น้ำ'),
        ('ศูนย์การเรียนรู้ท้องถิ่น', 'ศูนย์การเรียนรู้ท้องถิ่น'),
        ('ศูนย์การเรียนรู้ทางวิชาการ', 'ศูนย์การเรียนรู้ทางวิชาการ'),
    ]
    place_id = models.AutoField(primary_key=True)
    id = models.CharField(max_length=255, blank=True, null=True) #idจากapi
    lat = models.FloatField(blank=True, null=True) #ละติจูด
    lng = models.FloatField(blank=True, null=True) #ลองติจูด
    openning_detail = models.CharField(max_length=1000,blank=True, null=True) #รายละเอียดการเปิดปิด
    place_name = models.CharField(max_length=50)
    location = models.CharField(max_length=255)
    place_type = models.CharField(max_length=50, choices=PLACE_TYPE_CHOICES)
    place_img = models.ImageField(upload_to='place_images/')  
    description = models.CharField(max_length=1000)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    website = models.CharField(max_length=255,blank=True, null=True)

    def __str__(self):
        return self.place_name

class TravelMemo(models.Model):
    MEMO_TYPE_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
    ]

    memo_id = models.AutoField(primary_key=True)  
    memo_type = models.CharField(max_length=50, choices=MEMO_TYPE_CHOICES, default='private') 
    memo_detail = models.CharField(max_length=500) 
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    place_id = models.ForeignKey(Place, on_delete=models.CASCADE, null=True) 

    def __str__(self):
        return f'{self.memo_id} - {self.memo_type}'

class MemoImage(models.Model):
    travel_memo = models.ForeignKey(TravelMemo, related_name='images', on_delete=models.CASCADE)  
    memo_img = models.ImageField(upload_to='memo_images/', blank=True)  
    def __str__(self):
        return f'Image for Memo {self.travel_memo.memo_id}'
    
class Review(models.Model):
    review_id = models.AutoField(primary_key=True)
    review_rate = models.IntegerField()
    review_detail = models.CharField(max_length=255)
    review_status = models.CharField(max_length=255, default='wait')
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    place_id = models.ForeignKey(Place, on_delete=models.CASCADE)

    def __str__(self):
        return f'Review {self.review_id} - Rate: {self.review_rate} - Place: {self.place_id.place_name}'

class ReviewImage(models.Model):
    review = models.ForeignKey(Review, related_name='images', on_delete=models.CASCADE)
    review_img = models.ImageField(upload_to='review_images/', blank=True)

    def __str__(self):
        return f'Image for Review {self.review.review_id}'
    
class FavPlace(models.Model):
    fav_id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    place_id = models.ForeignKey(Place, on_delete=models.CASCADE)

    def __str__(self):
        return f'FavPlace {self.fav_id} - User {self.user_id} likes {self.place_id.place_name}'

class Report(models.Model):
    REPORT_TYPE_CHOICES = [
    ('เนื้อหาที่ไม่เหมาะสม', 'เนื้อหาที่ไม่เหมาะสม'),
    ('สแปม', 'สแปม'),
    ('ข้อมูลเท็จ', 'ข้อมูลเท็จ'),
    ('การละเมิดลิขสิทธิ์', 'การละเมิดลิขสิทธิ์'),
    ('พฤติกรรมที่ไม่เหมาะสม', 'พฤติกรรมที่ไม่เหมาะสม'),
    ('อื่น ๆ', 'อื่น ๆ'),
    ]
    report_id = models.AutoField(primary_key=True)
    report_detail = models.CharField(max_length=300)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    report_status = models.CharField(max_length=10, default='wait')  
    memo_id = models.ForeignKey(
        'TravelMemo',
        on_delete=models.SET_NULL,
        null=True,  
        blank=True  
    )
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f'Report {self.report_id} - Status: {self.report_status}'
    
class PlacesRecommend(models.Model):
    PLACE_TYPE_CHOICES = [
        ('พิพิธภัณฑ์ศิลปะ', 'พิพิธภัณฑ์ศิลปะ'),
        ('พิพิธภัณฑ์ประวัติศาสตร์', 'พิพิธภัณฑ์ประวัติศาสตร์'),
        ('พิพิธภัณฑ์วิทยาศาสตร์', 'พิพิธภัณฑ์วิทยาศาสตร์'),
        ('พิพิธภัณฑ์ธรรมชาติวิทยา', 'พิพิธภัณฑ์ธรรมชาติวิทยา'),
        ('พิพิธภัณฑ์วัฒนธรรม', 'พิพิธภัณฑ์วัฒนธรรม'),
        ('พิพิธภัณฑ์สัตว์น้ำ', 'พิพิธภัณฑ์สัตว์น้ำ'),
        ('ศูนย์การเรียนรู้ท้องถิ่น', 'ศูนย์การเรียนรู้ท้องถิ่น'),
        ('ศูนย์การเรียนรู้ทางวิชาการ', 'ศูนย์การเรียนรู้ทางวิชาการ'),
    ]

    rec_place_id = models.AutoField(primary_key=True)
    rec_id = models.CharField(max_length=255, blank=True, null=True) #idจากapi
    rec_lat = models.FloatField(blank=True, null=True) #ละติจูด
    rec_lng = models.FloatField(blank=True, null=True) #ลองติจูด
    rec_openning_detail = models.CharField(max_length=1000,blank=True, null=True) #รายละเอียดการเปิดปิด
    rec_place_name = models.CharField(max_length=50)
    rec_location = models.CharField(max_length=255)
    rec_place_type = models.CharField(max_length=50, choices=PLACE_TYPE_CHOICES)
    rec_place_img = models.ImageField(upload_to='place_images/')  
    rec_description = models.CharField(max_length=1000)
    rec_phone_number = models.CharField(max_length=15, blank=True, null=True)
    rec_website = models.CharField(max_length=255,blank=True, null=True)
    rec_status = models.CharField(max_length=50, default='wait') 
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.rec_place_name
    
class Plans(models.Model):
    plan_id = models.AutoField(primary_key=True)  
    plan_name = models.CharField(max_length=50)  
    startdate = models.DateField()  
    enddate = models.DateField()  
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)  

    def __str__(self):
        return self.plan_name

class PlanPlace(models.Model):
    planplace_id = models.AutoField(primary_key=True) 
    place_id = models.ForeignKey('Place', on_delete=models.CASCADE)  
    plan_id = models.ForeignKey(Plans, on_delete=models.CASCADE)  

    def __str__(self):
        return f'PlanPlace for {self.plan_id.plan_name} on {self.place_id.place_name}'
    
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE) 
    message = models.TextField()  
    notification_type = models.CharField(max_length=50, choices=[  
        ('review_approved', 'Review Approved'),
        ('report_approved', 'Report Approved'),
    ])
    related_id = models.IntegerField()  
    is_read = models.BooleanField(default=False)  
    created_at = models.DateTimeField(auto_now_add=True)  
