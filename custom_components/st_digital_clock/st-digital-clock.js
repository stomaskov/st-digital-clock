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
      _time: { type: String, state: true } // Internal state for the time string
    };
  }

  // 2. Set configuration
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity (the digital clock sensor).");
    }
    if (config.font_size && typeof config.font_size !== 'string') {
      console.warn("Digital Clock: font_size should be a string (e.g., '3em', '48px'). Using default.");
      // Don't set invalid font_size, let default CSS apply
      config.font_size = undefined;
    }

    this._config = {
      font_size: null, // Default to null, let CSS handle the base size
      ...config // Merge user config
    };

    // Trigger time update when config changes (especially entity)
    this._updateTime(this.hass);
  }

  // 3. Link to editor element
  static async getConfigElement() {
    // Dynamically import the editor class when needed
    // Ensure the path is correct relative to where HA serves the file
    // Assuming it's served from the integration's directory mapped by HACS
    // Let's refine this path slightly, assuming HACS structure:
    // It might be served from /hacsfiles/st-digital-clock/st-digital-clock.js
    // However, relative import `./` should work if the editor is in the same file or module context.
    // For robustness if split later, use a path relative to the card URL.
    // Let's stick to relative import for now, assuming editor is bundled or imported correctly.
    // await import('./st-digital-clock-editor.js?v=1.1.0'); // If editor was separate
    // Since editor is below, no dynamic import needed here for this structure.
    return document.createElement('st-digital-clock-editor');
  }

  // 4. Provide default configuration for UI editor preview
  static getStubConfig(hass, entities) {
    // Find the first sensor entity from our domain
    const clockEntity = entities.find(
      (eid) => eid.startsWith("sensor.") && eid.includes("digital_clock")
    );
    return {
      entity: clockEntity || "sensor.digital_clock_time",
      font_size: "4em",
      hour_format: "24h", // Add default
      show_seconds: true    // Add default
    };
  }

  // 5. Get card size for layout
  getCardSize() {
    // Adjust based on typical appearance if needed
    return 2;
  }

  // 6. Update time based on hass state
  _updateTime(hass) {
    if (!hass || !this._config || !this._config.entity) {
      this._time = "Config Error"; // Show error if config is bad
      return;
    }
    const stateObj = hass.states[this._config.entity];
    if (!stateObj) {
      // Check if HA is still starting and states are not yet available
      if (hass.config.state !== 'RUNNING') {
        this._time = "Initializing...";
      } else {
        this._time = `Invalid Entity: ${this._config.entity}`; // Show error if entity doesn't exist
      }
      return;
    }

    const rawTime = stateObj.state; // Expected format HH:MM:SS from sensor
    let displayTime = rawTime;

    try {
      const parts = rawTime.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const seconds = parts[2];

      const showSeconds = this._config.show_seconds !== false; // Default true
      const use12Hour = this._config.hour_format === '12h';

      let displayHours = hours;
      let period = '';

      if (use12Hour) {
        period = hours >= 12 ? ' PM' : ' AM';
        displayHours = hours % 12;
        if (displayHours === 0) displayHours = 12; // Handle midnight/noon
      }

      displayTime = `<span class="math-inline">\{displayHours\}\:</span>{minutes}`;
      if (showSeconds) {
        displayTime += `:${seconds}`;
      }
      if (use12Hour) {
        displayTime += period;
      }

    } catch (e) {
      console.error("Error formatting time:", e);
      displayTime = rawTime; // Fallback to raw time on error
    }

    this._time = stateObj.state; // Get the time string from the sensor's state
  }

  // 7. Called when hass object changes
  updated(changedProperties) {
    super.updated(changedProperties); // Call super.updated()
    if (changedProperties.has('hass')) {
      this._updateTime(this.hass);
    }
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
           /* Apply inline style for font-size override */
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
  // No connected/disconnected callbacks needed for timer, sensor handles updates.
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
    this._config = config;
  }

  static get styles() {
    // You can add styles for the editor form here if needed
    return css`
        .form-row {
            margin-bottom: 16px;
            display: block; /* Ensure elements like picker take full width */
        }
        ha-textfield {
            width: 100%; /* Make text field take full width */
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

      // Helper to fire config changed event (keep the existing one)
      const _valueChanged = (ev) => {
        if (!this._config || !this.hass || !ev.target) {
          return;
        }
        const target = ev.target;
        const configKey = target.dataset.configKey || target.configValue;

        if (!configKey) {
          console.warn("No configKey found for element", target);
          return;
        }

        let newValue;
        // Handle specific types
        if (target.tagName === 'HA-RADIO') {
          // Value for radio buttons comes from the 'value' attribute of the selected radio
          newValue = target.value;
        } else if (target.type === 'checkbox' || target.tagName === 'HA-SWITCH') {
          newValue = target.checked;
        } else {
          newValue = target.value; // Default for textfield, select, picker etc.
        }


        // Don't store empty strings for optional fields like font_size
        if (configKey === 'font_size' && newValue === '') {
          newValue = undefined;
        }
        // Convert show_seconds radio value back to boolean
        if (configKey === 'show_seconds') {
          newValue = newValue === 'true'; // Radio values are strings
        }


        if (this._config[configKey] !== newValue) {
          const newConfig = { ...this._config, [configKey]: newValue };
          const event = new CustomEvent("config-changed", {
            detail: { config: newConfig },
            bubbles: true,
            composed: true,
          });
          this.dispatchEvent(event);
        }
      };

      const target = ev.target;
      // Get the property name from data-config-key attribute or fallback to configValue
      const configKey = target.dataset.configKey || target.configValue; // Use configValue as fallback

      if (!configKey) {
        console.warn("No configKey found for element", target);
        return;
      }

      let newValue = target.value;

      // Handle ha-entity-picker value change specifically
      if (target.tagName === 'HA-ENTITY-PICKER') {
        newValue = target.value; // ha-entity-picker value is directly the entity_id string
      } else if (target.type === 'checkbox') { // Example if you add checkboxes later
        newValue = target.checked;
      }


      // Don't store empty strings for optional fields like font_size
      if (configKey === 'font_size' && newValue === '') {
        newValue = undefined; // Store undefined or null
      }

      // Update the configuration object only if the value actually changed
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
                    .label="Hour Format (Optional)"
                    .value=${this._config.hour_format || '24h'} /* Default to 24h */
                    .configValue=${'hour_format'}
                    data-config-key="hour_format"
                    @selected=${_valueChanged} /* Use selected event for ha-select */
                    @closed=${(ev) => ev.stopPropagation()} /* Prevent closing accordion */
                    fixedMenuPosition /* Style */
                    naturalMenuWidth /* Style */
                >
                    <mwc-list-item value="24h">24 Hour</mwc-list-item>
                    <mwc-list-item value="12h">12 Hour</mwc-list-item>
                </ha-select>
             </div>

             <div class="form-row">
                 <label>Show Seconds?</label>
                 <ha-formfield .label=${"Yes"}>
                     <ha-radio
                         name="show_seconds"
                         value="true"
                         .checked=${this._config.show_seconds !== false} /* Default to true */
                         .configValue=${'show_seconds'}
                         data-config-key="show_seconds"
                         @change=${_valueChanged}
                     ></ha-radio>
                 </ha-formfield>
                 <ha-formfield .label=${"No"}>
                     <ha-radio
                         name="show_seconds"
                         value="false"
                         .checked=${this._config.show_seconds === false}
                         .configValue=${'show_seconds'}
                         data-config-key="show_seconds"
                         @change=${_valueChanged}
                     ></ha-radio>
                 </ha-formfield>
             </div>

        </div>
        `;
  }
}

customElements.define('st-digital-clock-editor', DigitalClockCardEditor);


// Add card info for the Picker UI
window.customCards = window.customCards || [];
window.customCards.push({
  type: "st-digital-clock-card",
  name: "Digital Clock Card",
  description: "Displays the time from the Digital Clock sensor.",
  preview: true, // Enable preview
  documentationURL: "https://github.com/stomaskov/st-digital-clock",
});