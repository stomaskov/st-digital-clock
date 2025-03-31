import {
  LitElement,
  html,
  css
} from 'https://unpkg.com/lit@2.8.0/index.js?module'; // Use a specific lit version from CDN

// --- Card Definition ---
class DigitalClockCard extends LitElement {

  // 1. Define properties
  static get properties() {
    return {
      hass: { type: Object }, // Home Assistant object
      _config: { type: Object, state: true }, // Card configuration
      _time: { type: String, state: true } // Internal state for the formatted time string
    };
  }

  // 2. Set configuration
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity (the digital clock sensor).");
    }
    if (config.font_size && typeof config.font_size !== 'string') {
         console.warn("Digital Clock Card: font_size should be a string (e.g., '3em', '48px'). Using default.");
         config.font_size = undefined; // Reset invalid font_size
    }

    // Set internal config, applying defaults for new options if not present
    this._config = {
      font_size: null,
      hour_format: '24h', // Default hour format
      show_seconds: true, // Default show seconds
      ...config // Merge user config, overriding defaults
    };

    // Ensure boolean type for show_seconds after merge
    this._config.show_seconds = this._config.show_seconds !== false;

    // Trigger time update when config changes (especially entity)
    this._updateTime(this.hass);
  }

  // 3. Link to editor element
  static async getConfigElement() {
    // Editor class is defined below in the same file
    return document.createElement('st-digital-clock-card-editor');
  }

  // 4. Provide default configuration for UI editor preview
  static getStubConfig(hass, entities) {
    // Find the first sensor entity from our domain
    const clockEntity = entities.find(
        (eid) => eid.startsWith("sensor.") && eid.includes("digital_clock")
    );
    return {
      entity: clockEntity || "sensor.digital_clock_time", // Default entity guess
      font_size: "4em",
      hour_format: "24h", // Add default for stub
      show_seconds: true    // Add default for stub
    };
  }

  // 5. Get card size for layout
  getCardSize() {
    return 2; // Adjust if needed based on content/options
  }

  // 6. Update time based on hass state and format according to config
  _updateTime(hass) {
     if (!hass || !this._config || !this._config.entity) {
        this._time = "Config Error";
        return;
     }
     const stateObj = hass.states[this._config.entity];
     if (!stateObj) {
        if (hass.config.state !== 'RUNNING') {
             this._time = "Initializing...";
        } else {
             this._time = `Invalid Entity: ${this._config.entity}`;
        }
        return;
     }

     // Format the time based on sensor state and config options
     const rawTime = stateObj.state; // Expected format HH:MM:SS from sensor
     let displayTime = rawTime; // Default to raw time as fallback

     try {
         const parts = rawTime.split(':');
         // Basic validation
         if (parts.length < 2 || parts.length > 3) {
             throw new Error("Unexpected time format from sensor.");
         }
         const hours = parseInt(parts[0], 10);
         const minutes = parts[1].padStart(2, '0'); // Ensure minutes have padding
         const seconds = (parts[2] || '00').padStart(2, '0'); // Ensure seconds have padding

         // Ensure parsed numbers are valid
         if (isNaN(hours) || isNaN(parseInt(minutes, 10)) || isNaN(parseInt(seconds, 10))) {
             throw new Error("Invalid time components after parsing.");
         }

         // Apply formatting options
         const showSeconds = this._config.show_seconds !== false; // Default true
         const use12Hour = this._config.hour_format === '12h';

         let displayHours = hours;
         let period = '';

         if (use12Hour) {
             period = hours >= 12 ? ' PM' : ' AM';
             displayHours = hours % 12;
             if (displayHours === 0) displayHours = 12; // Handle midnight (0 -> 12 AM) and noon (12 -> 12 PM)
         } else {
             displayHours = hours.toString().padStart(2, '0'); // Pad 24h format if needed
         }


         displayTime = `${displayHours}:${minutes}`;
         if (showSeconds) {
             displayTime += `:${seconds}`;
         }
         if (use12Hour) {
             displayTime += period;
         }

     } catch (e) {
         console.error("Digital Clock Card: Error formatting time from sensor state:", rawTime, e);
         // Fallback to raw time if formatting fails
         displayTime = rawTime;
     }

     this._time = displayTime;
  }

  // 7. Called when hass object changes
  updated(changedProperties) {
    super.updated(changedProperties); // Call superclass method
    if (changedProperties.has('hass')) {
      this._updateTime(this.hass);
    }
    // Re-evaluate time format if config changes (handled by setConfig calling _updateTime)
    // if (changedProperties.has('_config')) {
    //    this._updateTime(this.hass);
    // }
  }

   // 8. Define CSS Styles
   static get styles() {
       return css`
       :host { /* Style the host custom element */
           display: block;
       }
       ha-card {
           /* Use HA variables for base card appearance */
           background: var(--ha-card-background, var(--card-background-color, white));
           border-radius: var(--ha-card-border-radius, 12px);
           border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
           box-shadow: var(--ha-card-box-shadow, none);
           padding: 16px; /* Padding inside the card */
           height: 100%; /* Make card fill its grid area */
           box-sizing: border-box; /* Include padding/border in height */
           display: flex; /* Use flexbox for centering */
           flex-direction: column;
           justify-content: center;
           overflow: hidden; /* Prevent content spilling out */
       }
       .clock-container {
           display: flex;
           justify-content: center; /* Center horizontally */
           align-items: center; /* Center vertically */
           /* Use specific variables for the clock, falling back to HA theme vars */
           color: var(--st-digital-clock-text-color, var(--primary-text-color, black));
           font-size: var(--st-digital-clock-font-size, 3em); /* Default size */
           font-weight: bold;
           line-height: 1; /* Avoid extra spacing */
           white-space: nowrap; /* Prevent wrapping */
           overflow: hidden; /* Hide overflow */
           text-overflow: ellipsis; /* Show ... if too long */
           width: 100%; /* Ensure it tries to take available width */
           text-align: center; /* Center text */
           /* Inline style for font-size override will be applied here */
       }
       `;
   }


  // 9. Render the card's HTML
  render() {
    if (!this._config || !this.hass) {
      return html`<ha-card>Loading...</ha-card>`; // Show loading state
    }

    // Apply custom font size if configured, otherwise rely on CSS var default
    const clockStyle = this._config.font_size ? `font-size: ${this._config.font_size};` : '';

    return html`
      <ha-card>
        <div class="clock-container" style="${clockStyle}">
          ${this._time}
        </div>
      </ha-card>
    `;
  }

  // --- Lifecycle Callbacks ---
}

// Register the card element
customElements.define('st-digital-clock-card', DigitalClockCard);

// --- Editor Definition (in the same file) ---

class DigitalClockCardEditor extends LitElement {

    static get properties() {
        return {
        hass: { type: Object },
        _config: { type: Object, state: true },
        };
    }

    setConfig(config) {
        // Store the current config for the editor UI
        this._config = config;
    }

    static get styles() {
        return css`
        .form-row {
            margin-bottom: 16px;
            display: block; /* Ensure elements like picker take full width */
        }
        ha-textfield, ha-select {
            width: 100%; /* Make text field and select take full width */
        }
        ha-formfield { /* Style radio button labels */
             display: inline-block;
             margin-right: 16px;
        }
        label { /* Style the radio group label */
            display: block;
            margin-bottom: 8px;
            font-weight: 500; /* Make it look like other labels */
        }
        `;
    }

    render() {
        if (!this.hass || !this._config) {
        return html``;
        }

        // Helper to fire config changed event
        const _valueChanged = (ev) => {
            if (!this._config || !this.hass || !ev.target) {
                return;
            }
            const target = ev.target;
            // Get the property name from data-config-key attribute or fallback to configValue
            const configKey = target.dataset.configKey || target.configValue;

            if (!configKey) {
                console.warn("No configKey found for element", target);
                return;
            }

            let newValue;
            // Handle specific element types
            if (target.tagName === 'HA-RADIO') {
                 newValue = target.value; // Value is 'true' or 'false' string
            } else if (target.tagName === 'HA-SWITCH' || target.type === 'checkbox') {
                 newValue = target.checked;
            } else if (target.tagName === 'HA-SELECT' || target.tagName === 'PAPER-LISTBOX') {
                 // Need to handle selected value from ha-select or paper-listbox
                 newValue = target.value;
            }
             else {
                 newValue = target.value; // Default for textfield, picker etc.
            }

            // Convert specific string values if needed
            if (configKey === 'show_seconds') {
                newValue = newValue === 'true'; // Convert radio string back to boolean
            }
            // Handle optional fields that might be cleared
            else if (configKey === 'font_size' && newValue === '') {
                 newValue = undefined; // Store undefined/null if cleared
            }

            // Only fire event if value actually changed
            if (this._config[configKey] !== newValue) {
                const newConfig = { ...this._config, [configKey]: newValue };

                // Fire the event to let HA know the config changed
                const event = new CustomEvent("config-changed", {
                    detail: { config: newConfig },
                    bubbles: true,
                    composed: true,
                });
                this.dispatchEvent(event);
            }
        };

        // Determine current state for radio buttons (defaulting to true if undefined)
        const showSecondsChecked = this._config.show_seconds !== false;

        return html`
        <div class="card-config">
            <div class="form-row">
                <ha-entity-picker
                    .label="Clock Sensor Entity (Required)"
                    .hass=${this.hass}
                    .value=${this._config.entity || ''}
                    .includeDomains=${["sensor"]}
                    .entityFilter=${(state) => state.attributes.device_id && this.hass.devices[state.attributes.device_id]?.integration === 'st_digital_clock'}
                    .required=${true}
                    .configValue=${'entity'}
                    data-config-key="entity"
                    @value-changed=${_valueChanged}
                    allow-custom-entity
                ></ha-entity-picker>
             </div>
             <div class="form-row">
                <ha-textfield
                    .label="Font Size (Optional, e.g., 5em, 48px)"
                    .value=${this._config.font_size || ''}
                    .configValue=${'font_size'}
                    data-config-key="font_size"
                    @input=${_valueChanged}
                    placeholder="Default (e.g., 3em)"
                ></ha-textfield>
             </div>

             <div class="form-row">
                <ha-select
                    .label="Hour Format"
                    .value=${this._config.hour_format || '24h'} /* Default to 24h */
                    .configValue=${'hour_format'}
                    data-config-key="hour_format"
                    @selected=${_valueChanged}
                    @closed=${(ev) => ev.stopPropagation()}
                    fixedMenuPosition
                    naturalMenuWidth
                >
                    <mwc-list-item value="24h">24 Hour</mwc-list-item>
                    <mwc-list-item value="12h">12 Hour</mwc-list-item>
                </ha-select>
             </div>

             <div class="form-row">
                 <label id="show-seconds-label">Show Seconds?</label>
                 <div role="radiogroup" aria-labelledby="show-seconds-label">
                     <ha-formfield .label=${"Yes"}>
                         <ha-radio
                             name="show_seconds_group"
                             value="true"
                             .checked=${showSecondsChecked}
                             .configValue=${'show_seconds'} /* Note: Value comes from event target */
                             data-config-key="show_seconds"
                             @change=${_valueChanged}
                         ></ha-radio>
                     </ha-formfield>
                     <ha-formfield .label=${"No"}>
                         <ha-radio
                             name="show_seconds_group"
                             value="false"
                             .checked=${!showSecondsChecked}
                             .configValue=${'show_seconds'}
                             data-config-key="show_seconds"
                             @change=${_valueChanged}
                         ></ha-radio>
                     </ha-formfield>
                 </div>
             </div>

        </div>
        `;
    }
}

customElements.define('st-digital-clock-card-editor', DigitalClockCardEditor);


// Add card info for the Picker UI
window.customCards = window.customCards || [];
window.customCards.push({
    type: "st-digital-clock-card",
    name: "Digital Clock Card",
    description: "Displays the time from the Digital Clock sensor with formatting options.",
    preview: true, // Enable preview in card picker
    documentationURL: "https://github.com/stomaskov/st-digital-clock", // Link to your repo
});