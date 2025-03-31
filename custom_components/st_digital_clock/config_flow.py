"""Config flow for st_digital_clock integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
# from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN, DEFAULT_NAME

_LOGGER = logging.getLogger(__name__)

# Schema for user configuration during setup (if any)
# For this simple clock, we might not need user input here,
# but you could add options like timezone or format later.
STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        # vol.Optional("name", default=DEFAULT_NAME): str, # Example: If you wanted custom name
    }
)


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for st_digital_clock."""

    VERSION = 1 # Schema version

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        # Check if already configured - only allow one instance for this simple clock
        await self.async_set_unique_id(DOMAIN) # Use domain as unique ID for singleton
        self._abort_if_unique_id_configured()

        if user_input is not None:
            # Here you would process user_input if you had options
            _LOGGER.info("User confirmed setup for Digital Clock.")
            # No specific data needed from user for this simple clock, pass empty dict
            return self.async_create_entry(title=DEFAULT_NAME, data={})

        # Show the form to the user (even if it has no fields, just confirmation)
        return self.async_show_form(
            step_id="user", data_schema=STEP_USER_DATA_SCHEMA
        )