"""Sensor platform for st_digital_clock."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

from homeassistant.components.sensor import (
    SensorDeviceClass, # Optional: Can define device class if appropriate
    SensorEntity,
    SensorStateClass, # Optional: Define state class if appropriate
)
from homeassistant.config_entries import ConfigEntry # Use ConfigEntry type hint
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_interval
import homeassistant.util.dt as dt_util # Use HA's date/time utilities

from .const import DOMAIN, DEFAULT_NAME, UPDATE_INTERVAL

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry, # Use ConfigEntry type
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the Digital Clock sensor from a config entry."""
    _LOGGER.info(f"Setting up Digital Clock sensor entity for entry: {entry.entry_id}")
    # Create the sensor entity
    # We use entry.entry_id as part of the unique ID to ensure uniqueness
    # if multiple instances were allowed in the future.
    unique_id = f"{DOMAIN}_{entry.entry_id}"
    sensor = DigitalClockSensor(hass, unique_id, entry)
    async_add_entities([sensor])


class DigitalClockSensor(SensorEntity):
    """Representation of a Digital Clock sensor that updates every second."""

    # _attr_device_class = SensorDeviceClass.TIMESTAMP # Example, not quite right for HH:MM:SS
    # _attr_state_class = SensorStateClass.MEASUREMENT # Example

    def __init__(self, hass: HomeAssistant, unique_id: str, entry: ConfigEntry) -> None:
        """Initialize the sensor."""
        self.hass = hass
        self._entry = entry # Store entry if needed for options later
        self._attr_name = DEFAULT_NAME # Default name, can be overridden in UI
        self._attr_unique_id = unique_id
        self._attr_icon = "mdi:clock-outline" # Give it an icon
        self._attr_should_poll = False # We update ourselves using a timer

        # Entity registry info (links entity to device/config entry)
        self._attr_device_info = {
            "identifiers": {(DOMAIN, self._entry.entry_id)},
            "name": "Digital Clock",
            "manufacturer": "Custom Integration", # Replace with your name/handle
            "model": "Software Sensor",
            "entry_type": "service", # Indicate it's provided by an integration
        }

        # Internal state
        self._unsub_timer = None
        self._update_internal_state() # Set initial state

        _LOGGER.debug(f"Initialized DigitalClockSensor: {self.name} ({self.unique_id})")


    def _update_internal_state(self) -> None:
        """Update the sensor's internal state."""
        # Use HA's timezone-aware now()
        now = dt_util.now()
        # Store the formatted time string as the native value
        self._attr_native_value = now.strftime("%H:%M:%S")
        # You could also store the datetime object if needed for other attributes
        # self._attr_extra_state_attributes = {"datetime": now.isoformat()}


    async def async_update(self) -> None:
        """Fetch new state data for the sensor. (Not used due to timer)."""
        # This method is intentionally left blank because we use a timer
        # for updates, avoiding the need for HA's polling mechanism.
        pass


    async def async_added_to_hass(self) -> None:
        """Run when entity about to be added to hass."""
        await super().async_added_to_hass()
        _LOGGER.debug(f"Sensor {self.name} added to HASS. Starting timer.")
        # Update state immediately
        self._update_internal_state()
        self.async_write_ha_state()

        # Set up the timer to update the state every second
        # Using async_track_time_interval is preferred for frequent updates
        self._unsub_timer = async_track_time_interval(
            self.hass,
            self._timer_update, # Method to call
            UPDATE_INTERVAL   # Interval from const.py
        )


    async def async_will_remove_from_hass(self) -> None:
        """Run when entity will be removed from hass."""
        _LOGGER.debug(f"Sensor {self.name} removing from HASS. Stopping timer.")
        if self._unsub_timer:
            self._unsub_timer() # Call the function returned by async_track_time_interval
            self._unsub_timer = None
        await super().async_will_remove_from_hass()


    @callback
    def _timer_update(self, now=None) -> None:
        """Update the sensor state periodically."""
        # 'now' argument is passed by async_track_time_interval
        self._update_internal_state()
        # Update the state in Home Assistant
        self.async_write_ha_state()