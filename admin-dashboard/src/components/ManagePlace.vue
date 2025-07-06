<template>
  <v-container class="request-list">
    <Sidebar /><br /><br />
    <h2>จัดการสถานที่</h2>

    <br />
    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="filterType"
          :items="placeTypes"
          label="ประเภทสถานที่"
          outlined
        ></v-select>
      </v-col>

      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          label="ค้นหาสถานที่"
          outlined
          append-icon="mdi-magnify"
        ></v-text-field>
      </v-col>

      <v-col
        cols="12"
        md="4"
        style="margin-bottom: 20px"
        class="d-flex justify-end align-center"
      >
        <!-- เพิ่มสถานที่ -->
        <v-btn
          height="50px"
          @click="addDialog = true"
          color="#B8E2F8"
          outlined
          fab
        >
          <v-icon size="32" color="white">mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <div
      v-if="loading"
      style="
        position: fixed;
        top: 50%;
        left: 60%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 9999;
      "
    >
      <v-progress-circular
        indeterminate
        color="#b8e2f8"
        size="100"
        width="10"
      />
      <p style="margin-top: 20px; font-weight: bold; color: #555">
        กำลังโหลดข้อมูล...
      </p>
    </div>

    <!-- แสดงข้อมูลสถานที่ -->
    <v-data-table
      :headers="headers"
      :items="filteredPlaces"
      item-key="place_id"
      class="elevation-1"
      v-else
    >
      <template v-slot:[`item.place_name`]="{ item }">
        {{ item.place_name }}
      </template>

      <template v-slot:[`item.place_type`]="{ item }">
        {{ item.place_type }}
      </template>

      <template v-slot:[`item.actions`]="{ item }">
        <v-btn
          style="margin: 20px"
          @click="showDetails(item)"
          outlined
          small
          class="action-btn"
          >ดูรายละเอียด</v-btn
        >
        <v-btn
          style="margin: 20px; border: 1px solid black"
          @click="editPlace(item)"
          outlined
          small
          class="action-btn"
        >
          <v-icon>mdi-pencil-plus</v-icon>
        </v-btn>

        <v-btn
          style="margin: 20px"
          @click="deletePlace(item)"
          color="red"
          outlined
          small
          class="action-btn"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">รายละเอียดสถานที่</span>
        </v-card-title>
        <v-card-text>
          <v-img
            :src="selectedPlace?.place_img"
            height="300px"
            class="mb-4"
          /><br />
          <div>
            <h3>{{ selectedPlace?.place_name }}</h3>
          </div>
          <br />
          <hr />
          <br />
          <div>
            <strong>ประเภทสถานที่ :</strong> {{ selectedPlace?.place_type }}
          </div>
          <br />
          <div><strong>ที่ตั้ง :</strong> {{ selectedPlace?.location }}</div>
          <br />
          <div>
            <strong>รายละเอียด :</strong> {{ selectedPlace?.description }}
          </div>
          <br />
          <div>
            <strong>โทรศัพท์ :</strong> {{ selectedPlace?.phone_number }}
          </div>
          <br />
          <div>
            <strong>เว็บไซต์ :</strong>
            <a :href="selectedPlace?.website" target="_blank">{{
              selectedPlace?.website
            }}</a>
          </div>
          <br />
          <div>
            <strong>เวลาเปิดทำการ :</strong>
            {{ selectedPlace?.openning_detail }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="dialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog แก้ไขสถานที่ -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">แก้ไขข้อมูลสถานที่</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="selectedPlace.place_name"
            label="ชื่อสถานที่"
            outlined
          ></v-text-field>
          <v-text-field
            v-model="selectedPlace.location"
            label="ที่ตั้ง"
            outlined
          ></v-text-field>
          <v-select
            v-model="selectedPlace.place_type"
            :items="placeTypes"
            label="ประเภทสถานที่"
            outlined
            required
          ></v-select>
          <v-textarea
            v-model="selectedPlace.description"
            label="รายละเอียด"
            outlined
          ></v-textarea>
          <v-text-field
            v-model="selectedPlace.phone_number"
            label="โทรศัพท์"
            outlined
          ></v-text-field>
          <v-text-field
            v-model="selectedPlace.website"
            label="เว็บไซต์"
            outlined
          ></v-text-field>
          <v-textarea
            v-model="selectedPlace.openning_detail"
            label="เวลาเปิดทำการ"
            outlined
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="saveChanges">บันทึก</v-btn>
          <v-btn @click="editDialog = false">ยกเลิก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Dialog เพิ่มสถานที่ -->
    <v-dialog v-model="addDialog" width="800px">
      <v-card>
        <v-card-title>
          <span class="headline">เพิ่มสถานที่ใหม่</span>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="selectedPlaceId"
            :items="autocompleteResults"
            label="ค้นหาสถานที่"
            item-value="place_id"
            item-title="structured_formatting.main_text"
            item-text="structured_formatting.secondary_text"
            @update:search="fetchAutocomplete"
            @update:modelValue="onSelectPlace"
            clearable
            outlined
          ></v-autocomplete>

          <v-text-field
            v-model="newPlace.place_name"
            label="ชื่อสถานที่"
            outlined
          ></v-text-field>
          <v-text-field
            v-model="newPlace.location"
            label="ที่ตั้ง"
            outlined
          ></v-text-field>
          <v-text-field
            v-model="newPlace.lat"
            label="ละติจูด"
            outlined
          ></v-text-field>
          <v-text-field
            v-model="newPlace.lng"
            label="ลองจิจูด"
            outlined
          ></v-text-field>
          <v-select
            v-model="newPlace.place_type"
            :items="placeTypes"
            label="ประเภทสถานที่"
            outlined
          ></v-select>
          <v-textarea
            v-model="newPlace.description"
            label="รายละเอียด"
            outlined
          ></v-textarea>
          <v-text-field
            v-model="newPlace.phone_number"
            label="โทรศัพท์"
            outlined
          ></v-text-field>
          <v-text-field
            v-model="newPlace.website"
            label="เว็บไซต์"
            outlined
          ></v-text-field>
          <v-textarea
            v-model="newPlace.openning_detail"
            label="เวลาเปิดทำการ"
            outlined
          ></v-textarea>
          <v-file-input
            label="อัพโหลดรูปภาพ"
            @change="handleFileUpload"
            outlined
          ></v-file-input>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="saveNewPlace">บันทึก</v-btn>
          <v-btn @click="addDialog = false">ยกเลิก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import Sidebar from "./Sidebar.vue";
import apiClient from "@/apiClient";

export default {
  components: {
    Sidebar,
  },
  data() {
    return {
      loading: true,
      places: [],
      dialog: false,
      editDialog: false,
      selectedPlace: null,
      filterType: "ทุกประเภท",
      searchQuery: "",
      searchAuto: "",
      addDialog: false,
      selectedPlaceId: "",
      autocompleteResults: [],
      newPlace: {
        id: "",
        lat: "",
        lng: "",
        place_name: "",
        location: "",
        place_type: "",
        description: "",
        phone_number: "",
        website: "",
        openning_detail: "",
        place_img: null,
      },
      placeTypes: [
        "พิพิธภัณฑ์ศิลปะ",
        "พิพิธภัณฑ์ประวัติศาสตร์",
        "พิพิธภัณฑ์วิทยาศาสตร์",
        "พิพิธภัณฑ์ธรรมชาติวิทยา",
        "พิพิธภัณฑ์วัฒนธรรม",
        "พิพิธภัณฑ์สัตว์น้ำ",
        "ศูนย์การเรียนรู้ท้องถิ่น",
        "ศูนย์การเรียนรู้ทางวิชาการ",
        "ทุกประเภท",
      ],
      headers: [
        { text: "ชื่อสถานที่", align: "start", value: "place_name" },
        { text: "ประเภทสถานที่", align: "start", value: "place_type" },
        { text: "Actions", value: "actions", align: "center" },
      ],
    };
  },
  watch: {
    searchQuery(newQuery) {
      if (newQuery.length > 2) {
        this.fetchAutocomplete(newQuery);
      } else {
        this.autocompleteResults = [];
      }
    },
  },
  computed: {
    filteredPlaces() {
      const filtered = this.places.filter((place) => {
        const matchesType =
          this.filterType === "ทุกประเภท" ||
          place.place_type === this.filterType;
        const matchesSearch = place.place_name
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());
        return matchesType && matchesSearch;
      });

      return filtered.sort((a, b) => b.place_id - a.place_id);
    },
  },
  async created() {
    try {
      const response = await apiClient.get("/places/");
      this.places = response.data;
      console.log("Places:", this.places);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async fetchAutocomplete(query) {
      setTimeout(async () => {
        try {
          const response = await apiClient.get(`/autocomplete/`, {
            params: { input: query },
          });
          this.autocompleteResults = response.data.predictions; // อัปเดตข้อมูลให้ dropdown
          console.log("✅ Autocomplete Results:", this.autocompleteResults);
        } catch (error) {
          console.error("❌ Error fetching autocomplete:", error);
        }
      }, 200); // Delay 100ms
    },

    onSelectPlace(placeId) {
      console.log("📌 Selected Place:", placeId);
      if (placeId) {
        this.fetchPlaceDetails(placeId);
      }
    },
    async fetchPlaceDetails(placeId) {
      if (!placeId) return;
      console.log("Fetching details for Place ID:", placeId);

      try {
        const response = await apiClient.get(`/place_details/`, {
          params: { place_id: placeId },
        });

        if (response.data.result) {
          this.newPlace = {
            ...this.newPlace,
            id: placeId,
            place_name: response.data.result.name,
            location: response.data.result.formatted_address,
            lat: response.data.result.geometry.location.lat,
            lng: response.data.result.geometry.location.lng,
            phone_number: response.data.result.formatted_phone_number || "",
            website: response.data.result.website || "",
            openning_detail:
              response.data.result.opening_hours?.weekday_text?.join(", ") ||
              "",
          };
          console.log("✅ Updated newPlace:", this.newPlace);
        }
      } catch (error) {
        console.error("❌ Error fetching place details:", error);
      }
    },

    showDetails(place) {
      this.selectedPlace = place;
      this.dialog = true;
    },
    editPlace(place) {
      this.selectedPlace = { ...place };
      this.editDialog = true;
    },
    saveChanges() {
      if (!this.selectedPlace || !this.selectedPlace.place_id) return;

      const updatedData = {
        place_name: this.selectedPlace.place_name,
        location: this.selectedPlace.location,
        place_type: this.selectedPlace.place_type,
        description: this.selectedPlace.description,
        phone_number: this.selectedPlace.phone_number,
        website: this.selectedPlace.website,
        openning_detail: this.selectedPlace.openning_detail,
      };

      apiClient
        .put(`/places/${this.selectedPlace.place_id}/`, updatedData)
        .then((response) => {
          const index = this.places.findIndex(
            (p) => p.place_id === response.data.place_id
          );
          if (index !== -1) {
            this.places[index] = response.data;
          }
          this.editDialog = false;
        })
        .catch((error) => {
          console.error("Error updating place:", error);
        });
    },

    deletePlace(place) {
      if (!place || !place.place_id) return;

      if (confirm(`คุณต้องการลบสถานที่ "${place.place_name}" หรือไม่?`)) {
        apiClient
          .delete(`/places/${place.place_id}/`)
          .then(() => {
            this.places = this.places.filter(
              (p) => p.place_id !== place.place_id
            );
          })
          .catch((error) => {
            console.error("Error deleting place:", error);
          });
      }
    },
    handleFileUpload(event) {
      this.newPlace.place_img = event.target.files[0];
    },
    async saveNewPlace() {
      try {
        let formData = new FormData();

        Object.keys(this.newPlace).forEach((key) => {
          if (this.newPlace[key]) {
            formData.append(key, this.newPlace[key]);
          }
        });

        console.log("FormData ที่ส่งไป:", [...formData.entries()]); // Log ข้อมูลที่ส่งไป

        const token = localStorage.getItem("access_token");
        const headers = {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        };

        const response = await apiClient.post("/places/", formData, {
          headers,
        });

        console.log("Response จาก API:", response.data);

        this.places.push(response.data);
        this.addDialog = false;
        this.resetNewPlace();
        this.selectedPlaceId = "";
        alert("เพิ่มสถานที่เรียบร้อย");
      } catch (error) {
        console.error(
          "Error adding place:",
          error.response?.data || error.message
        );
      }
    },
    resetNewPlace() {
      this.newPlace = {
        id: "",
        lat: "",
        lng: "",
        place_name: "",
        location: "",
        place_type: "",
        description: "",
        phone_number: "",
        website: "",
        openning_detail: "",
        place_img: null,
      };
      this.selectedPlaceId = "";
    },
  },
};
</script>

<style scoped>
.request-list {
  padding: 20px;
  margin-left: 280px;
}

.v-data-table {
  margin-top: 20px;
}

.v-btn {
  margin-right: 10px;
}

.v-btn:hover {
  transform: scale(1.05);
  transition: all 0.2s;
}

.action-btn {
  margin-right: 10px;
}

th,
td {
  padding: 16px 24px;
}

.v-data-table th {
  padding-left: 24px;
}

.v-data-table td {
  padding-left: 16px;
}

.v-btn {
  min-width: 100px;
}
</style>
