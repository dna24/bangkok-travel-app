<template>
  <div>
    <!-- ตาราง -->
    <v-data-table
      :headers="headers"
      :items="places"
      item-key="rec_place_id"
      class="elevation-1"
    >
      <template v-slot:[`item.rec_place_name`]="{ item }">
        {{ item.rec_place_name }}
      </template>

      <template v-slot:[`item.rec_place_type`]="{ item }">
        <p class="placetype">{{ item.rec_place_type }}</p>
      </template>

      <template v-slot:[`item.actions`]="{ item }">
        <v-btn @click="showDetails(item)" outlined small class="action-btn">
          ดูรายละเอียด
        </v-btn>
        <v-btn
          v-if="!hideActions"
          @click="$emit('approve', item)"
          color="green"
          outlined
          small
          class="action-btn"
        >
          อนุมัติ
        </v-btn>
        <v-btn
          v-if="!hideActions"
          @click="$emit('deny', item)"
          :disabled="loading"
          color="red"
          outlined
          small
          class="action-btn"
        >
          ไม่อนุมัติ
        </v-btn>
      </template>
    </v-data-table>

    <!-- Popup รายละเอียด -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">รายละเอียดสถานที่</span>
        </v-card-title>
        <v-card-text>
          <v-img
            :src="selectedPlace?.rec_place_img"
            height="300px"
            class="mb-4"
          />
          <div>
            <h3>{{ selectedPlace?.rec_place_name }}</h3>
          </div>
          <br />
          <hr />
          <br />
          <div>
            <strong>ประเภทสถานที่ :</strong> {{ selectedPlace?.rec_place_type }}
          </div>
          <br />
          <div>
            <strong>รายละเอียด :</strong> {{ selectedPlace?.rec_description }}
          </div>
          <br />
          <div>
            <strong>โทรศัพท์ :</strong> {{ selectedPlace?.rec_phone_number }}
          </div>
          <br />
          <div>
            <strong>เว็บไซต์ :</strong>
            <a :href="selectedPlace?.rec_website" target="_blank">{{
              selectedPlace?.rec_website
            }}</a>
          </div>
          <br />
          <div>
            <strong>เวลาเปิดทำการ :</strong>
            {{ selectedPlace?.rec_openning_detail }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="dialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
    places: Array,
    loading: Boolean,
    hideActions: Boolean,
  },
  data() {
    return {
      dialog: false,
      selectedPlace: null,
      headers: [
        { text: "ชื่อสถานที่", align: "start", value: "rec_place_name" },
        { text: "ประเภทสถานที่", align: "start", value: "rec_place_type" },
        { text: "Actions", value: "actions", align: "center" },
      ],
    };
  },
  methods: {
    showDetails(place) {
      this.selectedPlace = place;
      this.dialog = true;
    },
  },
};
</script>

<style scoped>
.v-btn {
  margin-right: 10px;
}
.placetype {
  border: 2px solid #b8e2f8;
  border-radius: 10px;
  padding: 4px;
  text-align: center;
  width: 180px;
}
</style>
