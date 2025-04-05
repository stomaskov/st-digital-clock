import {
    LitElement,
    html,
    css
} from './lit-all.min.js';

// --- Card Definition ---
class DigitalClockCard extends LitElement {

    // 1. Define properties
    static get properties() {
        return {
            hass: { type: Object }, // Home Assistant object (still useful for context, theming)
            _config: { type: Object, state: true }, // Card configuration
            _time: { type: String, state: true }, // Internal state for the formatted time string
            _timerId: { state: true } // Internal state for the timer interval ID
        };
    }

    // 2. Set configuration
    setConfig(config) {
        // Removed entity check

        if (config.font_size && typeof config.font_size !== 'string') {
            console.warn("Digital Clock Card: font_size should be a string (e.g., '3em', '48px'). Using default.");
            config.font_size = undefined; // Reset invalid font_size
        }

        // Set internal config, applying defaults for new options if not present
        this._config = {
            font_size: null, // Default null, CSS will handle base size
            hour_format: '24h', // Default hour format
            show_seconds: true, // Default show seconds
            theme: config.theme ?? 'default', // Default theme
            ...config // Merge user config, overriding defaults
        };

        // Ensure boolean type for show_seconds after merge
        this._config.show_seconds = this._config.show_seconds !== false;

        // Trigger time update/render when config changes (especially format options)
        this._renderTime();
    }

    // --- Lifecycle Callbacks ---
    connectedCallback() {
        super.connectedCallback();
        // Start timer when card is added to DOM
        if (!this._timerId) {
            this._renderTime(); // Render immediately
            this._timerId = setInterval(() => this._renderTime(), 1000); // Update every second
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Stop timer when card is removed from DOM
        if (this._timerId) {
            clearInterval(this._timerId);
            this._timerId = null;
        }
    }
    // --- End Lifecycle Callbacks ---


    // 3. Link to editor element
    static async getConfigElement() {
        // Editor class is defined below in the same file
        return document.createElement('st-digital-clock-card-editor');
    }

    // 4. Provide default configuration for UI editor preview
    static getStubConfig() {
        // Removed entity logic
        return {
            // entity: "sensor.digital_clock_time", // No longer needed
            font_size: "4em",
            hour_format: "24h", // Add default for stub
            show_seconds: true,     // Add default for stub
            theme: 'default'
        };
    }

    // 5. Get card size for layout
    getCardSize() {
        return 2; // Adjust if needed based on content/options
    }

    // 6. Get current time and format according to config
    _renderTime() {
        if (!this._config) {
            this._time = "Config Error";
            return;
        }

        try {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            // Apply formatting options
            const showSeconds = this._config.show_seconds !== false; // Default true
            const use12Hour = this._config.hour_format === '12h';

            let displayHours = hours;
            let period = '';
            let displayMinutes = minutes.toString().padStart(2, '0');
            let displaySeconds = seconds.toString().padStart(2, '0');

            if (use12Hour) {
                period = hours >= 12 ? ' PM' : ' AM';
                displayHours = hours % 12;
                if (displayHours === 0) displayHours = 12; // Handle midnight (0 -> 12 AM) and noon (12 -> 12 PM)
            } else {
                displayHours = hours.toString(); // 24h format often doesn't pad hour unless single digit
                // Optionally pad: displayHours = hours.toString().padStart(2, '0');
            }

            let displayTime = `${displayHours}:${displayMinutes}`;
            if (showSeconds) {
                displayTime += `:${displaySeconds}`;
            }
            if (use12Hour) {
                displayTime += period;
            }

            this._time = displayTime;

        } catch (e) {
            console.error("Digital Clock Card: Error getting/formatting time:", e);
            this._time = "Time Error";
        }
    }

    // 8. Define CSS Styles
    static get styles() {
        return css`
        :host {
            display: block;
        }
        /* Default Card Appearance using HA Variables */
        ha-card {
            background: var(--ha-card-background, var(--card-background-color, white));
            border-radius: var(--ha-card-border-radius, 12px);
            border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
            box-shadow: var(--ha-card-box-shadow, rgba(0, 0, 0, 0.16) 0px 2px 4px 0px);
            padding: 16px;
            height: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
            transition: background 0.3s ease-in-out, border 0.3s ease-in-out, box-shadow 0.3s ease-in-out; /* Added transition */
        }
        /* Theme Modifications */
        ha-card.theme-mushroom_shadow {
            background: none;
            border: none;
            box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.16);;

        }
        ha-card.theme-mushroom_square {
            background: none;
            border: none;
            box-shadow: none;
            border-radius: var(--mush-shape-radius, 4px);
        }
        /* Clock Text Styling */
        .clock-container {
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--st-digital-clock-text-color, var(--primary-text-color, black));
            font-size: var(--st-digital-clock-font-size, 3em);
            font-weight: bold;
            line-height: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            text-align: center;
        }
        /* Optional: Subtle adjustments for Mushroom if needed */
        /* ha-card.theme-mushroom { padding: 12px; } */ /* Example: Slightly less padding like Mushroom cards often have */
        /* ha-card.theme-mushroom .clock-container { font-weight: normal; } */ /* Example: Mushroom often uses normal font weight */
        `;
    }


    // 9. Render the card's HTML
    render() {
        // No hass check needed here anymore, just config
        if (!this._config) {
            return html`<ha-card>Loading...</ha-card>`; // Show loading state
        }

        const clockStyle = this._config.font_size ? `font-size: ${this._config.font_size};` : '';
        // Add the theme class to the ha-card
        const themeName = this._config.theme || 'default';
        const themeClass = `theme-${themeName}`;


        return html`
        <ha-card class="${themeClass}">
            <div class="clock-container" style="${clockStyle}">
            ${this._time}
            </div>
        </ha-card>
        `;
    }
}

// Register the card element
customElements.define('st-digital-clock-card', DigitalClockCard);


// --- Editor Definition (Simplified) ---

// NOTE: It's often cleaner to put the editor in a separate file,
// but keeping it here for simplicity based on the original code.
// If you split, ensure the import in getConfigElement() is correct.

class DigitalClockCardEditor extends LitElement {

    static get properties() {
        return {
            hass: { type: Object }, // Still needed for HA elements like ha-select
            _config: { type: Object, state: true },
        };
    }

    setConfig(config) {
        // Store the current config for the editor UI
        this._config = config;
    }

    static get styles() {
        // Keep existing styles
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

        // Helper to fire config changed event (Keep existing helper)
        const _valueChanged = (ev) => {
            if (!this._config || !this.hass || !ev.target) {
                return;
            }
            const target = ev.target;
            // Get the property name from data-config-key attribute
            const configKey = target.dataset.configKey; // Prefer data- attribute

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
                // Create a new config object with the changed value
                const newConfig = { ...this._config };

                // Update or remove the key
                if (newValue === undefined) {
                    delete newConfig[configKey]; // Remove key if value is undefined (e.g., cleared optional field)
                } else {
                    newConfig[configKey] = newValue;
                }

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
                <ha-textfield
                    .label="Font Size (Optional, e.g., 5em, 48px)"
                    .value=${this._config.font_size || ''}
                    data-config-key="font_size"
                    @input=${_valueChanged}
                    placeholder="Default (e.g., 3em)"
                ></ha-textfield>
            </div>

            <div class="form-row">
                <ha-select
                    .label="Hour Format"
                    .value=${this._config.hour_format || '24h'}
                    data-config-key="hour_format"
                    @selected=${_valueChanged}
                    @closed=${(ev) => ev.stopPropagation()}
                    fixedMenuPosition naturalMenuWidth
                >
                    <mwc-list-item value="24h">24 Hour</mwc-list-item>
                    <mwc-list-item value="12h">12 Hour</mwc-list-item>
                </ha-select>
            </div>

            <div class="form-row">
                 <label id="show-seconds-label">Show Seconds?</label>
                 <div role="radiogroup" aria-labelledby="show-seconds-label">
                     <ha-formfield .label=${"Yes"}>
                         <ha-radio name="show_seconds_group" value="true" .checked=${showSecondsChecked} data-config-key="show_seconds" @change=${_valueChanged}></ha-radio>
                     </ha-formfield>
                     <ha-formfield .label=${"No"}>
                         <ha-radio name="show_seconds_group" value="false" .checked=${!showSecondsChecked} data-config-key="show_seconds" @change=${_valueChanged}></ha-radio>
                     </ha-formfield>
                 </div>
            </div>

            <div class="form-row">
                <ha-select
                    .label="Theme / Style"
                    .value=${this._config.theme || 'default'}
                    data-config-key="theme"
                    @selected=${_valueChanged}
                    @closed=${(ev) => ev.stopPropagation()}
                    fixedMenuPosition naturalMenuWidth
                >
                    <mwc-list-item value="default">Default</mwc-list-item>
                    <mwc-list-item value="transparent">Transparent</mwc-list-item>
                    <mwc-list-item value="mushroom">Mushroom (Blend)</mwc-list-item>
                    <mwc-list-item value="mushroom_square">Mushroom Square (Blend)</mwc-list-item>
                    <mwc-list-item value="mushroom_shadow">Mushroom Shadow (Blend)</mwc-list-item>
                    <mwc-list-item value="visionos">VisionOS Style</mwc-list-item>
                </ha-select>
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
    name: "Standalone Digital Clock Card", // Updated name
    description: "Displays the current browser time with formatting options. Does not require a sensor.", // Updated description
    preview: true, // Enable preview in card picker
    documentationURL: "https://github.com/stomaskov/st-digital-clock-card", // Link to original repo (adjust if forked)
});