"""Constants for the st_digital_clock integration."""

DOMAIN = "st_digital_clock"
PLATFORMS = ["sensor"] # We are creating a sensor

# Path for the JS module based on manifest.json
# This assumes HACS installation places it correctly.
CARD_NAME = "st-digital-clock"
CARD_URL = f"/hacsfiles/{CARD_NAME}/{CARD_NAME}.js" # Standard HACS resource path

DEFAULT_NAME = "Digital Clock Time"
UPDATE_INTERVAL = timedelta(seconds=1) # How often sensor should update