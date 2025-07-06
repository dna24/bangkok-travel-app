import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapboxGL from '@rnmapbox/maps';
import polyline from '@mapbox/polyline';
import { apiClient, getUserId } from '../../services/apiClient';
import EditPlanModal from '../component/EditPlanModal';
import { FontAwesome } from '@expo/vector-icons';

MapboxGL.setAccessToken("pk.eyJ1IjoiZGFueXIyNCIsImEiOiJjbTlxcXR6N3AweXRwMnFvbjQxcXdkb2M5In0.6uqKEfsvg1ULU7X_mkeIVQ");

const PlanDetail = ({ route, navigation }) => {
    const { planId } = route.params;
    const [planPlaces, setPlanPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [directions, setDirections] = useState(null);
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: 13.7563,
        longitude: 100.5018,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [userLocation, setUserLocation] = useState(null);
    const [planName, setPlanName] = useState('');
    const [planStartDate, setPlanStartDate] = useState('');
    const [planEndDate, setPlanEndDate] = useState('');
    const [durationplan, setDurationPlan] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const openInGoogleMaps = (lat, lng) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
        Linking.openURL(url).catch(err => console.error('Error opening Google Maps:', err));
    };    

    useEffect(() => {
        getUserLocation();
    }, [planId]);

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            let latitude = 13.7563;
            let longitude = 100.5018;

            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                latitude = location.coords.latitude;
                longitude = location.coords.longitude;
            } else {
                console.log("Location permission not granted, using default location.");
            }

            setUserLocation({ latitude, longitude });
            setMapRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });

            fetchPlanDetails(latitude, longitude);
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180); 
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
        const distance = R * c; // Distance in km
        return distance;
    };    

    const fetchPlanDetails = async (userLatitude, userLongitude) => {
        try {
            const planResponse = await apiClient.get('plans/', { params: { id: planId } });
            const selectedPlan = planResponse.data.find(plan => plan.plan_id === planId);
        
            if (selectedPlan) {
                setPlanName(selectedPlan.plan_name || '');
                const planDuration = selectedPlan.duration;
                setDurationPlan(planDuration + ' วัน');
                setPlanStartDate(selectedPlan.startdate || '');
                setPlanEndDate(selectedPlan.enddate || '');
            }
    
            const planPlacesResponse = await apiClient.get('planplaces/');
            const filteredPlanPlaces = planPlacesResponse.data.filter((planPlace) => planPlace.plan_id === planId);
            const placeIds = filteredPlanPlaces.map((p) => p.place_id);
        
            const placesResponse = await apiClient.get('places/', { params: { ids: placeIds } });
            
            const combinedData = filteredPlanPlaces.map((planPlace) => {
                const place = placesResponse.data.find((p) => p.place_id === planPlace.place_id);
                return { ...planPlace, placeDetails: place || {} };
            });
    
            // Sort places based on distance from user's location
            combinedData.sort((a, b) => {
                const distanceA = getDistance(userLatitude, userLongitude, a.placeDetails?.lat, a.placeDetails?.lng);
                const distanceB = getDistance(userLatitude, userLongitude, b.placeDetails?.lat, b.placeDetails?.lng);
                return distanceA - distanceB; // Sort in ascending order of distance
            });
    
            setPlanPlaces(combinedData);
            fetchDirections(combinedData, userLatitude, userLongitude);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'ไม่สามารถดึงข้อมูลได้');
        } finally {
            setLoading(false);
        }
    };    

    const fetchDirections = async (places, userLatitude, userLongitude) => {
        if (places.length < 2) return;
        
        const origin = `${userLatitude},${userLongitude}`;
        const destination = `${places[places.length - 1].placeDetails?.lat},${places[places.length - 1].placeDetails?.lng}`;
        const waypoints = places
            .map(place => `${place.placeDetails?.lat},${place.placeDetails?.lng}`)
            .filter(waypoint => waypoint !== destination) 
            .join('|');
    
        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            console.log('Access Token in Plan:', accessToken);
            if (!accessToken) throw new Error("Access token not found");
        
            const response = await apiClient.get('directions/', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
                params: { origin, destination, waypoints },
            });
    
            if (!response.data?.routes?.length) throw new Error('Google API Error: No routes found');
        
            const routeData = response.data.routes[0];
        
            if (routeData.overview_polyline) {
                const decodedPolyline = polyline.decode(routeData.overview_polyline.points);
                setDirections(decodedPolyline.map(([latitude, longitude]) => ({ latitude, longitude })));
            }
        
            if (routeData.legs && routeData.legs.length > 0) {
                const totalDistance = routeData.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000;
                setDistance(totalDistance.toFixed(2) + ' กิโลเมตร');
    
                const totalDuration = routeData.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60;
                let formattedDuration;
                if (totalDuration >= 60) {
                    const hours = Math.floor(totalDuration / 60);
                    const minutes = Math.round(totalDuration % 60);
                    formattedDuration = `${hours} ชั่วโมง ${minutes} นาที`;
                } else {
                    formattedDuration = `${Math.round(totalDuration)} นาที`;
                }
    
                setDuration(formattedDuration);
            }
    
        } catch (error) {
            console.error('Error fetching directions:', error);
            Alert.alert('Error', `ไม่สามารถดึงเส้นทางได้: ${error.message}`);
        }
    };    

    if (loading) {
        return (
            <View style={styles.containerLoading}>
                <ActivityIndicator size="large" color="#22B37A" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <Text style={styles.headerText}>วางแผนท่องเที่ยว</Text>
                <View style={styles.planInfoContainer}>
                    <Text style={styles.planName}>{planName}</Text>
                    <Text style={styles.planDuration}>ระยะเวลา {durationplan}</Text>
                </View>
            </View>
    
            <FlatList
                data={planPlaces}
                keyExtractor={(item) => item.planplace_id.toString()}
                renderItem={({ item, index }) => (
                    item.placeDetails ? (
                        <TouchableOpacity onPress={() => navigation.navigate('PlaceDetails', { id: item.placeDetails.place_id })}>
                            <View style={styles.card}>
                                <View style={[styles.colorStrip, { backgroundColor: index % 2 === 0 ? "#22B37A" : "#C9ECDE" }]} />
                                <View style={styles.cardContent}>
                                    <Image source={{ uri: item.placeDetails.place_img }} style={styles.image} />
                                    <View style={styles.textContainer}>
                                        <Text style={styles.cardTitle}>{item.placeDetails.place_name}</Text>
                                        <Text style={styles.placeType}>{item.placeDetails.place_type}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : null
                )}
            />
    
    <MapboxGL.MapView style={{ height: 280, width: '100%' }}>
        <MapboxGL.Camera
            zoomLevel={10}
            centerCoordinate={[mapRegion.longitude, mapRegion.latitude]}
        />

        {userLocation && (
            <MapboxGL.MarkerView
                id="user-location"
                coordinate={[userLocation.longitude, userLocation.latitude]}
            >
                <Image source={require('../../assets/user-marker.png')} style={styles.placeMarker} />
            </MapboxGL.MarkerView>
        )}

        {planPlaces.map((place, index) => (
            <MapboxGL.MarkerView
                key={`place-${index}`}
                id={`place-${index}`}
                coordinate={[place.placeDetails?.lng, place.placeDetails?.lat]}
            >
                <View style={{ alignItems: 'center' }}>
                    <View style={styles.markerLabel}>
                        <Text style={styles.markerLabelText}>{place.placeDetails?.place_name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => openInGoogleMaps(place.placeDetails?.lat, place.placeDetails?.lng)}>
                        <Image source={require('../../assets/place-marker.png')} style={styles.placeMarker} />
                    </TouchableOpacity>
                </View>
            </MapboxGL.MarkerView>
        ))}

        {directions && (
            <MapboxGL.ShapeSource
                id="routeLine"
                shape={{
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: directions.map(p => [p.longitude, p.latitude]),
                    },
                }}
            >
                <MapboxGL.LineLayer
                    id="routeLineLayer"
                    style={{ lineWidth: 3, lineColor: '#22B37A' }}
                />
            </MapboxGL.ShapeSource>
        )}
    </MapboxGL.MapView>
    
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>รวมระยะทาง: <Text style={{ color: '#22B37A' }}>{distance}</Text></Text>
                <Text style={styles.summaryText}>เวลาโดยประมาณ: <Text style={{ color: '#22B37A' }}>{duration}</Text></Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                    <FontAwesome name="pencil" size={20} color="white"/>
                </TouchableOpacity>
            </View>

            <EditPlanModal
                show={modalVisible}
                handleClose={() => setModalVisible(false)}
                plan={{
                    id: planId,
                    name: planName,
                    startdate: planStartDate,
                    enddate: planEndDate,
                    places: planPlaces
                }}
                handleSave={() => {
                    setModalVisible(false);
                    fetchPlanDetails(userLocation.latitude, userLocation.longitude);
                }}
                fetchPlans={() => {}}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, paddingBottom: 100, backgroundColor: 'white' },
    containerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerWrapper: { paddingBottom: 10 },
    headerText: {
        fontSize: 18,
        fontFamily: "NotoSansThai_700Bold",
        marginTop: 30,
    },
    map: { width: '100%', height: '40%' },
    placeMarker: {
        width: 30,
        height: 30,
    },
    card: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 10,
        marginBottom: 5,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 1,
        alignItems: "stretch",
        overflow: "hidden"
    },
    colorStrip: {
        width: 10,  
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },     
    cardContent: {
        flexDirection: "row",
        flex: 1,
        padding: 10
    }, 
    image: { width: 80, height: 80, borderRadius: 10, marginRight: 20 },
    textContainer: { flex: 1, justifyContent: "flex-start" },
    cardTitle: { fontSize: 16, fontFamily: 'NotoSansThai_700Bold' },
    placeType: { 
        fontSize: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#22B37A",
        fontFamily: 'NotoSansThai_400Regular',
        marginTop: 5,
        alignSelf: "flex-start",
        color: "gray",
    },
    distanceText: { textAlign: 'center', fontSize: 16, fontFamily: 'NotoSansThai_700Bold', margin: 5, color: '#22B37A' },
    headerWrapper: { paddingBottom: 10 },
    planInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    planName: { fontSize: 18, fontFamily: 'NotoSansThai_700Bold', color: '#22B37A' },
    planDuration: { fontSize: 16, fontFamily: 'NotoSansThai_400Regular', color: 'gray' },
    summaryContainer: { flexDirection: 'column', justifyContent: 'space-around', paddingVertical: 10 },
    summaryText: { fontSize: 14, fontFamily: 'NotoSansThai_700Bold', marginVertical: 5,},
    buttonContainer: {
        position: 'absolute',
        bottom: 100,
        right: 20,
    },
    addButton: {
        backgroundColor: "#28a745",
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'NotoSansThai_700Bold',
    },
    markerLabel: {
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        maxWidth: 120,
    },
    markerLabelText: {
        fontSize: 10,
        fontFamily: 'NotoSansThai_400Regular',
        color: '#333',
        textAlign: 'center',
    },    
});

export default PlanDetail;
