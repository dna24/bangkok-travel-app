# Generated by Django 5.0.6 on 2025-04-06 02:43

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0004_notification_delete_userpreference'),
    ]

    operations = [
        migrations.AlterField(
            model_name='report',
            name='memo_id',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='myapp.travelmemo'),
        ),
    ]
