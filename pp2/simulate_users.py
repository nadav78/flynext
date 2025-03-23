import requests
import json
import time
import random
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API Base URL
BASE_URL = "http://localhost:3000"  # Change this to match your server

class FlyNextAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.headers = {"Content-Type": "application/json"}
    
    def register_user(self, email, password, first_name, last_name, phone_number=None):
        """Register a new user"""
        url = f"{self.base_url}/api/users/register"
        payload = {
            "email": email,
            "password": password,
            "first_name": first_name,
            "last_name": last_name
        }
        if phone_number:
            payload["phone_number"] = phone_number
        
        response = requests.post(url, json=payload, headers=self.headers)
        logger.info(f"Registration response ({response.status_code}): {response.text[:100]}...")
        return response.json() if response.status_code == 201 else None
    
    def login(self, email, password):
        """Login a user and store the access and refresh tokens"""
        url = f"{self.base_url}/api/users/login"
        payload = {"email": email, "password": password}
        
        response = requests.post(url, json=payload, headers=self.headers)
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("accessToken")
            self.refresh_token = data.get("refreshToken")
            self.headers["Authorization"] = f"Bearer {self.access_token}"
            logger.info(f"Login successful for {email}")
            return True
        else:
            logger.error(f"Login failed: {response.status_code} - {response.text}")
            return False
    
    def get_profile(self):
        """Get the user's profile"""
        url = f"{self.base_url}/api/users/profile"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Get profile failed: {response.status_code} - {response.text}")
            return None
    
    def create_hotel(self, hotel_data):
        """Create a new hotel"""
        url = f"{self.base_url}/api/hotels"
        response = requests.post(url, json=hotel_data, headers=self.headers)
        if response.status_code == 201:
            logger.info(f"Hotel created successfully")
            return response.json()
        else:
            logger.error(f"Create hotel failed: {response.status_code} - {response.text}")
            return None
    
    def create_room_type(self, hotel_id, room_data):
        """Create a new room type for a hotel"""
        url = f"{self.base_url}/api/hotels/{hotel_id}/room-types"
        response = requests.post(url, json=room_data, headers=self.headers)
        if response.status_code == 201:
            logger.info(f"Room type created successfully")
            return response.json()
        else:
            logger.error(f"Create room type failed: {response.status_code} - {response.text}")
            return None
    
    def search_hotels(self, city, check_in_date, check_out_date, **filters):
        """Search for hotels based on criteria"""
        url = f"{self.base_url}/api/hotels/search"
        params = {
            "city": city,
            "check_in": check_in_date,
            "check_out": check_out_date
        }
        # Add any additional filters
        for key, value in filters.items():
            params[key] = value
            
        response = requests.get(url, params=params, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Hotel search failed: {response.status_code} - {response.text}")
            return None
    
    def get_hotel_details(self, hotel_id):
        """Get detailed information about a hotel"""
        url = f"{self.base_url}/api/hotels/{hotel_id}"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Get hotel details failed: {response.status_code} - {response.text}")
            return None
    
    def book_hotel(self, hotel_id, room_type_id, check_in_date, check_out_date, guests):
        """Book a hotel room"""
        url = f"{self.base_url}/api/bookings"
        payload = {
            "hotel_id": hotel_id,
            "room_type_id": room_type_id,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date,
            "guests": guests
        }
        response = requests.post(url, json=payload, headers=self.headers)
        if response.status_code == 201:
            logger.info(f"Hotel booked successfully")
            return response.json()
        else:
            logger.error(f"Hotel booking failed: {response.status_code} - {response.text}")
            return None
    
    def get_hotel_bookings(self, hotel_id, **filters):
        """Get bookings for a hotel"""
        url = f"{self.base_url}/api/hotels/{hotel_id}/bookings"
        params = {}
        # Add any filters
        for key, value in filters.items():
            params[key] = value
            
        response = requests.get(url, params=params, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Get hotel bookings failed: {response.status_code} - {response.text}")
            return None
    
    def get_room_availability(self, hotel_id, start_date=None, end_date=None):
        """Get room availability for a hotel"""
        url = f"{self.base_url}/api/hotels/{hotel_id}/availability"
        params = {}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
            
        response = requests.get(url, params=params, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Get room availability failed: {response.status_code} - {response.text}")
            return None

# Simulation functions
def simulate_hotel_owner():
    """Simulate a hotel owner user flow"""
    logger.info("=== Starting Hotel Owner Simulation ===")
    
    # Create API client
    api = FlyNextAPI(BASE_URL)
    
    # Register hotel owner
    owner_email = f"owner_{int(time.time())}@example.com"
    owner_password = "password123"
    logger.info(f"Registering hotel owner with email: {owner_email}")
    api.register_user(
        email=owner_email,
        password=owner_password,
        first_name="Hotel",
        last_name="Owner",
        phone_number="123-456-7890"
    )
    
    # Login as hotel owner
    logger.info(f"Logging in as hotel owner: {owner_email}")
    if not api.login(owner_email, owner_password):
        logger.error("Hotel owner login failed, aborting simulation")
        return None
    
    # Create a hotel
    hotel_data = {
        "name": f"Luxury Hotel {random.randint(1, 1000)}",
        "address": "123 Main Street",
        "city": "Toronto",
        "country": "Canada",
        "star_rating": 4,
        "description": "A beautiful luxury hotel in downtown Toronto",
        "website": "http://luxuryhotel.example.com",
        "contact_email": "info@luxuryhotel.example.com",
        "contact_phone": "123-456-7890",
        "amenities": ["WiFi", "Pool", "Gym", "Restaurant", "Bar"]
    }
    logger.info(f"Creating hotel: {hotel_data['name']}")
    hotel_response = api.create_hotel(hotel_data)
    
    if not hotel_response:
        logger.error("Hotel creation failed, aborting simulation")
        return None
    
    hotel_id = hotel_response.get("hotel", {}).get("id")
    if not hotel_id:
        logger.error("Could not extract hotel ID from response")
        return None
    
    logger.info(f"Created hotel with ID: {hotel_id}")
    
    # Create room types
    room_types = []
    room_type_data = [
        {
            "name": "Standard Room",
            "price_per_night": 99.99,
            "room_count": 10,
            "amenities": ["Queen Bed", "TV", "Coffee Maker"]
        },
        {
            "name": "Deluxe Room",
            "price_per_night": 149.99,
            "room_count": 5,
            "amenities": ["King Bed", "TV", "Mini Bar", "Coffee Maker"]
        },
        {
            "name": "Executive Suite",
            "price_per_night": 249.99,
            "room_count": 2,
            "amenities": ["King Bed", "Separate Living Area", "Jacuzzi", "Mini Bar", "Coffee Maker"]
        }
    ]
    
    for room_data in room_type_data:
        logger.info(f"Creating room type: {room_data['name']}")
        room_response = api.create_room_type(hotel_id, room_data)
        if room_response:
            room_type_id = room_response.get("id")
            if room_type_id:
                room_types.append({"id": room_type_id, "data": room_data})
                logger.info(f"Created room type with ID: {room_type_id}")
    
    return {
        "owner": {"email": owner_email, "password": owner_password},
        "hotel": {"id": hotel_id, "data": hotel_data},
        "room_types": room_types
    }

def simulate_regular_user(hotel_owner_data):
    """Simulate a regular user flow"""
    if not hotel_owner_data:
        logger.error("No hotel owner data available, aborting regular user simulation")
        return
    
    logger.info("=== Starting Regular User Simulation ===")
    
    # Create API client
    api = FlyNextAPI(BASE_URL)
    
    # Register regular user
    user_email = f"user_{int(time.time())}@example.com"
    user_password = "password123"
    logger.info(f"Registering user with email: {user_email}")
    api.register_user(
        email=user_email,
        password=user_password,
        first_name="Regular",
        last_name="User"
    )
    
    # Login as regular user
    logger.info(f"Logging in as user: {user_email}")
    if not api.login(user_email, user_password):
        logger.error("User login failed, aborting simulation")
        return
    
    # Get hotel details (assuming search would return this hotel)
    hotel_id = hotel_owner_data["hotel"]["id"]
    logger.info(f"Getting details for hotel ID: {hotel_id}")
    hotel_details = api.get_hotel_details(hotel_id)
    
    if not hotel_details:
        logger.error("Failed to get hotel details, aborting simulation")
        return
    
    logger.info(f"Retrieved details for hotel: {hotel_details.get('name', 'Unknown')}")
    
    # Select a room type to book
    if not hotel_owner_data["room_types"]:
        logger.error("No room types available, aborting booking simulation")
        return
    
    room_type = hotel_owner_data["room_types"][0]
    room_type_id = room_type["id"]
    
    # Create booking
    check_in_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    check_out_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    
    logger.info(f"Booking room type {room_type_id} from {check_in_date} to {check_out_date}")
    booking_response = api.book_hotel(
        hotel_id=hotel_id,
        room_type_id=room_type_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        guests=2
    )
    
    if booking_response:
        booking_id = booking_response.get("id")
        logger.info(f"Successfully created booking with ID: {booking_id}")
    else:
        logger.error("Booking creation failed")
    
    return {
        "user": {"email": user_email, "password": user_password},
        "booking": booking_response,
        "check_in_date": check_in_date,
        "check_out_date": check_out_date
    }

def check_hotel_status(hotel_owner_data, regular_user_data):
    """Hotel owner checks room availability and bookings"""
    if not hotel_owner_data or not regular_user_data:
        logger.error("Missing data, aborting hotel status check")
        return
    
    logger.info("=== Hotel Owner Checking Status ===")
    
    # Create API client
    api = FlyNextAPI(BASE_URL)
    
    # Login as hotel owner
    owner_email = hotel_owner_data["owner"]["email"]
    owner_password = hotel_owner_data["owner"]["password"]
    
    logger.info(f"Logging back in as hotel owner: {owner_email}")
    if not api.login(owner_email, owner_password):
        logger.error("Hotel owner login failed, aborting status check")
        return
    
    hotel_id = hotel_owner_data["hotel"]["id"]
    
    # Check room availability
    logger.info(f"Checking room availability for hotel ID: {hotel_id}")
    availability = api.get_room_availability(
        hotel_id=hotel_id,
        start_date=regular_user_data["check_in_date"],
        end_date=regular_user_data["check_out_date"]
    )
    
    if availability:
        logger.info(f"Room availability: {json.dumps(availability, indent=2)}")
    else:
        logger.error("Failed to get room availability")
    
    # Check bookings
    logger.info(f"Checking bookings for hotel ID: {hotel_id}")
    bookings = api.get_hotel_bookings(hotel_id)
    
    if bookings:
        logger.info(f"Hotel bookings: {json.dumps(bookings, indent=2)}")
    else:
        logger.error("Failed to get hotel bookings")

def main():
    """Main simulation function"""
    try:
        logger.info("Starting FlyNext API user simulation")
        
        # Simulate hotel owner flow
        hotel_owner_data = simulate_hotel_owner()
        
        if not hotel_owner_data:
            logger.error("Hotel owner simulation failed, stopping")
            return
        
        # Give the server a moment to process
        time.sleep(1)
        
        # Simulate regular user flow
        regular_user_data = simulate_regular_user(hotel_owner_data)
        
        if not regular_user_data:
            logger.error("Regular user simulation failed, stopping")
            return
        
        # Give the server a moment to process
        time.sleep(1)
        
        # Hotel owner checks status
        check_hotel_status(hotel_owner_data, regular_user_data)
        
        logger.info("Simulation completed successfully")
        
    except Exception as e:
        logger.exception(f"An error occurred during simulation: {str(e)}")

if __name__ == "__main__":
    main()
