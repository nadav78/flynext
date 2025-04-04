import requests
import json
import random
import datetime
import time
import argparse
import os
from faker import Faker  # You may need to install this: pip install faker
from collections import Counter

class ApiTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.fake = Faker()
        self.users = []
        self.hotel_owners = []
        self.hotels = []
        self.room_types = []
        self.reservations = []
        
        # Track response codes for final report
        self.response_codes = []
        self.endpoint_responses = {}
        
        # Load valid cities and countries
        self.cities_data = self.load_cities_data()

    def load_cities_data(self):
        """Load valid cities and countries from cities.json"""
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_dir = os.path.dirname(script_dir)  # Go up one level
            cities_path = os.path.join(project_dir, 'cities.json')
            
            # If the file doesn't exist in the project directory, look in the same directory as the script
            if not os.path.exists(cities_path):
                cities_path = os.path.join(script_dir, 'cities.json')
                
            # If still not found, check the current working directory
            if not os.path.exists(cities_path):
                cities_path = os.path.join(os.getcwd(), 'cities.json')
            
            with open(cities_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading cities data: {e}")
            # Fallback to a few common cities if the file can't be loaded
            return [
                {"city": "New York", "country": "United States"},
                {"city": "Toronto", "country": "Canada"},
                {"city": "Vancouver", "country": "Canada"},
                {"city": "Miami", "country": "United States"},
                {"city": "Chicago", "country": "United States"},
                {"city": "San Francisco", "country": "United States"}
            ]

    def print_response(self, response, message=""):
        """Helper method to print API responses"""
        print(f"\n{message}")
        print(f"Status code: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response: {response.text}")
            
        # Track response code for reporting
        self.response_codes.append(response.status_code)
        
        # Track response code by endpoint
        endpoint = response.request.path_url.split('?')[0]  # Extract base endpoint without query params
        if endpoint not in self.endpoint_responses:
            self.endpoint_responses[endpoint] = []
        self.endpoint_responses[endpoint].append(response.status_code)
        
        return response

    def register_user(self, email=None, password="Password123!", is_hotel_owner=False):
        """Register a new user"""
        if not email:
            email = self.fake.email()
        
        data = {
            "email": email,
            "password": password,
            "first_name": self.fake.first_name(),
            "last_name": self.fake.last_name(),
            "phone_number": self.fake.phone_number(),
            "profileImage": f"https://randomuser.me/api/portraits/men/{random.randint(1, 99)}.jpg"
        }
        
        url = f"{self.base_url}/api/users/register"
        response = requests.post(url, json=data)
        
        message = f"Registering {'hotel owner' if is_hotel_owner else 'user'}: {email}"
        self.print_response(response, message)
        
        if response.status_code == 201:
            # Login to get tokens
            login_response = self.login_user(email, password)
            
            if login_response.status_code == 200:
                user_data = login_response.json()
                user = {
                    "id": user_data["user"]["id"],
                    "email": email,
                    "password": password,
                    "access_token": user_data.get("accessToken", ""),
                    "name": f"{data['first_name']} {data['last_name']}"
                }
                
                if is_hotel_owner:
                    self.hotel_owners.append(user)
                else:
                    self.users.append(user)
                    
                return user
        
        return None

    def login_user(self, email, password):
        """Login a user and get access token"""
        url = f"{self.base_url}/api/users/login"
        data = {
            "email": email,
            "password": password
        }
        response = requests.post(url, json=data)
        self.print_response(response, f"Logging in user: {email}")
        return response

    def create_hotel(self, owner):
        """Create a hotel for an owner"""
        url = f"{self.base_url}/api/hotels"
        headers = {"Authorization": f"Bearer {owner['access_token']}"}
        
        name = f"{self.fake.company()} Hotel"
        
        # Select a random city/country from the valid list
        location = random.choice(self.cities_data)
        city = location["city"]
        country = location["country"]
        
        # Sanitize the company name for email by removing special chars and spaces
        email_name = name.lower().replace(' ', '').replace(',', '').replace('.', '')
        # Ensure it doesn't have other special characters
        email_name = ''.join(c for c in email_name if c.isalnum())
        
        # Generate sample amenities
        amenities = random.sample([
            "Free WiFi", "Swimming Pool", "Fitness Center", "Restaurant", 
            "Bar/Lounge", "Room Service", "Conference Room", "Spa", 
            "Parking", "Airport Shuttle", "Business Center", "Concierge"
        ], random.randint(3, 6))
        
        data = {
            "name": name,
            "address": self.fake.street_address(),
            "city": city,
            "country": country,
            "star_rating": random.randint(1, 5),
            "description": f"A beautiful hotel in {city}, {country}",
            "website": f"https://www.{email_name}.com",
            "contact_email": f"info@{email_name}.com",
            "contact_phone": self.fake.phone_number(),
            "amenities": amenities
        }
        
        response = requests.post(url, json=data, headers=headers)
        self.print_response(response, f"Creating hotel for owner {owner['name']}")
        
        if response.status_code == 201:
            hotel_data = response.json().get("hotel", {})
            hotel = {
                "id": hotel_data.get("id"),
                "name": name,
                "owner_id": owner["id"],
                "city": city,
                "country": country
            }
            self.hotels.append(hotel)
            return hotel
        
        return None

    def create_room_type(self, owner, hotel):
        """Create a room type for a hotel"""
        url = f"{self.base_url}/api/hotels/owner/room-type"
        headers = {"Authorization": f"Bearer {owner['access_token']}"}
        
        room_type_name = random.choice(["Single", "Double", "Twin", "Suite", "Deluxe", "Presidential"])
        amenities = random.sample(
            ["WiFi", "TV", "Mini-bar", "Balcony", "Air conditioning", "Safe", "Coffee maker"], 
            random.randint(2, 5)
        )
        
        data = {
            "hotel_id": hotel["id"],
            "name": room_type_name,
            "price_per_night": round(random.uniform(50, 500), 2),
            "room_count": random.randint(1, 10),
            "amenities": amenities
        }
        
        response = requests.post(url, json=data, headers=headers)
        self.print_response(response, f"Creating room type {room_type_name} for hotel {hotel['name']}")
        
        if response.status_code == 201:
            room_type = response.json()
            room_type["hotel_name"] = hotel["name"]
            self.room_types.append(room_type)
            return room_type
        
        return None

    def get_hotels(self, search_params=None, user=None):
        """Search for hotels with filters"""
        url = f"{self.base_url}/api/hotels/public"
        params = search_params or {}
        
        # Use the provided user's token, or default to first available user
        auth_user = user
        if not auth_user:
            # Try to find an authenticated user to use
            if self.users:
                auth_user = self.users[0]
            elif self.hotel_owners:
                auth_user = self.hotel_owners[0]
            else:
                print("Warning: No authenticated user available for hotel search")
                return []
        
        headers = {"Authorization": f"Bearer {auth_user['access_token']}"}
        
        response = requests.get(url, params=params, headers=headers)
        self.print_response(response, f"Searching hotels with params: {params}")
        
        if response.status_code == 200:
            return response.json().get("hotels", [])
        
        return []

    def get_owner_hotels(self, owner):
        """Get hotels owned by a specific owner"""
        url = f"{self.base_url}/api/hotels/owner"
        headers = {"Authorization": f"Bearer {owner['access_token']}"}
        
        response = requests.get(url, headers=headers)
        self.print_response(response, f"Getting hotels for owner {owner['name']}")
        
        if response.status_code == 200:
            return response.json()
        
        return []

    def get_hotel_room_types(self, owner, hotel_id):
        """Get room types for a specific hotel"""
        url = f"{self.base_url}/api/hotels/owner/room-type"
        headers = {"Authorization": f"Bearer {owner['access_token']}"}
        params = {"hotel_id": hotel_id}
        
        response = requests.get(url, headers=headers, params=params)
        self.print_response(response, f"Getting room types for hotel ID {hotel_id}")
        
        if response.status_code == 200:
            return response.json()
        
        return []

    def make_reservation(self, user, hotel_id, room_type_id):
        """Make a hotel reservation"""
        url = f"{self.base_url}/api/hotels/public/reserve"
        headers = {"Authorization": f"Bearer {user['access_token']}"}
        
        # Generate check-in and check-out dates
        today = datetime.datetime.now()
        check_in = today + datetime.timedelta(days=random.randint(1, 30))
        check_out = check_in + datetime.timedelta(days=random.randint(1, 7))
        
        data = {
            "hotel_id": hotel_id,
            "room_type_id": room_type_id,
            "check_in_time": check_in.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            "check_out_time": check_out.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        }
        
        response = requests.post(url, json=data, headers=headers)
        self.print_response(response, f"Creating reservation for user {user['name']}")
        
        if response.status_code == 201:
            reservation = response.json()
            self.reservations.append(reservation)
            return reservation
        
        return None

    def get_user_reservations(self, user):
        """Get all reservations for a user"""
        url = f"{self.base_url}/api/hotels/public/reserve"
        headers = {"Authorization": f"Bearer {user['access_token']}"}
        
        response = requests.get(url, headers=headers)
        self.print_response(response, f"Getting reservations for user {user['name']}")
        
        if response.status_code == 200:
            return response.json()
        
        return []

    def get_hotel_reservations(self, owner, hotel_id, filters=None):
        """Get reservations for a specific hotel"""
        url = f"{self.base_url}/api/hotels/owner/reservations"
        headers = {"Authorization": f"Bearer {owner['access_token']}"}
        params = {"hotel_id": hotel_id}
        
        if filters:
            params.update(filters)
            
        response = requests.get(url, params=params, headers=headers)
        self.print_response(response, f"Getting reservations for hotel ID {hotel_id}")
        
        if response.status_code == 200:
            return response.json()
        
        return []

    def cancel_reservation(self, owner, reservation_id):
        """Cancel a reservation as hotel owner"""
        url = f"{self.base_url}/api/hotels/owner/reservations"
        headers = {"Authorization": f"Bearer {owner['access_token']}"}
        
        data = {
            "reservation_id": reservation_id,
            "is_cancelled": "true"
        }
        
        response = requests.patch(url, json=data, headers=headers)
        self.print_response(response, f"Cancelling reservation {reservation_id}")
        
        return response

    def generate_response_code_report(self):
        """Generate a report of response codes encountered during testing"""
        print("\n\n========== API RESPONSE CODE REPORT ==========")
        
        # Overall statistics
        code_counts = Counter(self.response_codes)
        total_requests = len(self.response_codes)
        
        print(f"\nTotal API requests made: {total_requests}")
        print("\nResponse Code Distribution:")
        
        # Sort by status code
        for code in sorted(code_counts.keys()):
            count = code_counts[code]
            percentage = (count / total_requests) * 100
            status_type = ""
            
            # Categorize status codes
            if 200 <= code < 300:
                status_type = "Success"
            elif 300 <= code < 400:
                status_type = "Redirection"
            elif 400 <= code < 500:
                status_type = "Client Error"
            elif 500 <= code < 600:
                status_type = "Server Error"
            
            print(f"  {code} ({status_type}): {count} occurrences ({percentage:.1f}%)")
        
        # Per-endpoint statistics
        print("\nResponse Codes by Endpoint:")
        for endpoint, codes in self.endpoint_responses.items():
            endpoint_counts = Counter(codes)
            print(f"\n  {endpoint}:")
            print(f"    Total requests: {len(codes)}")
            
            for code in sorted(endpoint_counts.keys()):
                count = endpoint_counts[code]
                percentage = (count / len(codes)) * 100
                print(f"    - {code}: {count} occurrences ({percentage:.1f}%)")
        
        print("\n==============================================")

    def run_test_scenario(self):
        """Run a complete test scenario"""
        print("\n=== STARTING FLYNET API TEST SCENARIO ===")
        
        # 1. Register users and hotel owners
        print("\n=== REGISTERING USERS ===")
        for i in range(3):  # Create 3 regular users
            self.register_user(email=f"user{i+1}@example.com")
            
        for i in range(2):  # Create 2 hotel owners
            self.register_user(email=f"owner{i+1}@example.com", is_hotel_owner=True)
        
        if not self.users or not self.hotel_owners:
            print("Failed to create users. Exiting.")
            return
            
        # 2. Create hotels for each owner
        print("\n=== CREATING HOTELS ===")
        for owner in self.hotel_owners:
            num_hotels = random.randint(1, 2)
            for _ in range(num_hotels):
                self.create_hotel(owner)
        
        # 3. Create room types for each hotel
        print("\n=== CREATING ROOM TYPES ===")
        for hotel in self.hotels:
            owner = next((o for o in self.hotel_owners if o["id"] == hotel["owner_id"]), None)
            if owner:
                num_room_types = random.randint(1, 3)
                for _ in range(num_room_types):
                    self.create_room_type(owner, hotel)
        
        # 4. Search for hotels with different filters
        print("\n=== SEARCHING HOTELS ===")
        # Make sure to pass a user for authenticated hotel search
        user = self.users[0] if self.users else None
        self.get_hotels(user=user)  # No filters
        self.get_hotels({"city": "New York"}, user=user)
        self.get_hotels({"star_rating": 5}, user=user)
        self.get_hotels({"price_min": 100, "price_max": 300}, user=user)
        
        # 5. Make reservations
        print("\n=== MAKING RESERVATIONS ===")
        all_hotels = self.get_hotels(user=user)
        
        if all_hotels:
            for user in self.users:
                hotel = random.choice(all_hotels)
                if hotel.get("HotelRoomType") and len(hotel["HotelRoomType"]) > 0:
                    room_type = random.choice(hotel["HotelRoomType"])
                    self.make_reservation(user, hotel["id"], room_type["id"])
        
        # 6. View user reservations
        print("\n=== VIEWING USER RESERVATIONS ===")
        for user in self.users:
            self.get_user_reservations(user)
        
        # 7. View hotel reservations as owner
        print("\n=== VIEWING HOTEL RESERVATIONS AS OWNER ===")
        for owner in self.hotel_owners:
            owner_hotels = self.get_owner_hotels(owner)
            for hotel in owner_hotels:
                self.get_hotel_reservations(owner, hotel["id"])
        
        # 8. Cancel a reservation
        print("\n=== CANCELLING RESERVATIONS ===")
        if self.users and self.hotel_owners and self.hotels:
            # Get a user's reservations
            user = random.choice(self.users)
            reservations = self.get_user_reservations(user)
            
            if reservations and len(reservations) > 0:
                # Find the hotel owner for this reservation
                res = reservations[0]
                hotel_id = res.get("hotelId")
                owner = None
                
                for o in self.hotel_owners:
                    owner_hotels = self.get_owner_hotels(o)
                    if any(h["id"] == hotel_id for h in owner_hotels):
                        owner = o
                        break
                
                if owner:
                    self.cancel_reservation(owner, res["id"])
        
        print("\n=== TEST SCENARIO COMPLETED ===")
        
        # Generate response code report
        self.generate_response_code_report()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the FlyNext API")
    parser.add_argument("--url", default="http://localhost:3000", help="Base URL of the API")
    parser.add_argument("--cities-file", help="Path to cities.json file")
    args = parser.parse_args()
    
    tester = ApiTester(base_url=args.url)
    tester.run_test_scenario()
