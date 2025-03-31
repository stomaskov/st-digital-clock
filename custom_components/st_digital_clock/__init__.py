"""The st_digital_clock integration."""
from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.discovery import async_load_platform
from homeassistant.const import Platform
import homeassistant.util.dt as dt_util

import logging
from datetime import timedelta

from .const import DOMAIN, PLATFORMS, CARD_URL, CARD_NAME # Added CARD_URL, CARD_NAME

_LOGGER = logging.getLogger(__name__)

# Define configuration schema if needed for configuration.yaml (though we prefer UI config)
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the st_digital_clock integration from YAML (optional)."""
    # Ensure domain data dictionary exists
    hass.data.setdefault(DOMAIN, {})
    # If you had YAML config options, process them here
    _LOGGER.info("Digital Clock integration async_setup called")
    return True # Return True if setup successful


async def async_setup_entry(hass: HomeAssistant, entry: config_entries.ConfigEntry) -> bool:
    """Set up st_digital_clock from a config entry (UI setup)."""
    _LOGGER.info(f"Setting up Digital Clock entry: {entry.entry_id}")
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data # Store config entry data if needed

    # Forward the setup to the sensor platform
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register the frontend card module
    # Note: HACS usually handles resource registration, but explicit registration
    # can be a fallback or used if not using HACS for deployment.
    # Let's rely on the manifest.json `frontend_resources` for HACS.
    # If deploying manually, you might uncomment below:
    # await hass.http.async_register_frontend_module(
    #     DOMAIN, # A unique identifier for your module
    #     CARD_URL # The URL defined in manifest.json
    # )
    # _LOGGER.info(f"Registered frontend module: {CARD_NAME} from {CARD_URL}")

    return True


async def async_unload_entry(hass: HomeAssistant, entry: config_entries.ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info(f"Unloading Digital Clock entry: {entry.entry_id}")

    # Unload platforms
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    # Clean up data
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
        # If you registered the frontend module manually, unregister it:
        # try:
        #     hass.http.async_unregister_frontend_module(DOMAIN)
        #     _LOGGER.info(f"Unregistered frontend module: {CARD_NAME}")
        # except ValueError: # Module might not have been registered
        #     pass

    return unload_ok