#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>
#include <SoftwareSerial.h>
#include <TinyGPS.h>
#include <CayenneLPP.h>

CayenneLPP lpp(150);

TinyGPS gps;
SoftwareSerial ss(3, 4); // Arduino TX, RX ,

//// LoRaWAN NwkSKey, network session key
static const PROGMEM u1_t NWKSKEY[16] = { 0x34, 0x49, 0xB1, 0x2E, 0x24, 0x97, 0x5F, 0x68, 0xAF, 0x43, 0x7E, 0xCD, 0x89, 0x75, 0x2E, 0x7F };
//// LoRaWAN AppSKey, application session key
static const u1_t PROGMEM APPSKEY[16] = { 0x47, 0x51, 0xC3, 0x36, 0xDD, 0x38, 0xBE, 0x8A, 0xAE, 0x61, 0xE4, 0x0E, 0xEA, 0xAB, 0x0B, 0x51 };
static const u4_t DEVADDR = 0x26002120;

static void smartdelay(unsigned long ms);

static osjob_t sendjob;

// Schedule TX every this many seconds (might become longer due to duty
// cycle limitations).
const unsigned TX_INTERVAL = 10;
// Pin mapping
const lmic_pinmap lmic_pins = {
  .nss = 10,
  .rxtx = LMIC_UNUSED_PIN,
  .rst = 9,
  .dio = {2, 6, 7},
};

// These callbacks are only used in over-the-air activation, so they are
// left empty here (we cannot leave them out completely unless
// DISABLE_JOIN is set in config.h, otherwise the linker will complain).
void os_getArtEui (u1_t* buf) { }
void os_getDevEui (u1_t* buf) { }
void os_getDevKey (u1_t* buf) { }

void setup() {
  // initialize both serial ports:
  Serial.begin(9600);  // Serial to print out GPS info in Arduino IDE
  ss.begin(9600); // SoftSerial port to get GPS data.
  while (!Serial) {
    ;
  };

  // LMIC init
  os_init();
  // Reset the MAC state. Session and pending data transfers will be discarded.
  LMIC_reset();

  LMIC_setClockError(MAX_CLOCK_ERROR * 1 / 100);

  // Set static session parameters. Instead of dynamically establishing a session
  // by joining the network, precomputed session parameters are be provided.
#ifdef PROGMEM
  // On AVR, these values are stored in flash and only copied to RAM
  // once. Copy them to a temporary buffer here, LMIC_setSession will
  // copy them into a buffer of its own again.
  uint8_t appskey[sizeof(APPSKEY)];
  uint8_t nwkskey[sizeof(NWKSKEY)];
  memcpy_P(appskey, APPSKEY, sizeof(APPSKEY));
  memcpy_P(nwkskey, NWKSKEY, sizeof(NWKSKEY));
  LMIC_setSession (0x1, DEVADDR, nwkskey, appskey);
#else
  // If not running an AVR with PROGMEM, just use the arrays directly
  LMIC_setSession (0x1, DEVADDR, NWKSKEY, APPSKEY);
#endif

  // THIS IS WHERE THE AUSTRALIA FREQUENCY MAGIC HAPPENS!
  // The frequency plan is hard-coded
  // But the band (or selected 8 channels) is configured here!
  // This is the same AU915 band as used by TTN

  // First, disable channels 0-7
  for (int channel = 0; channel < 8; ++channel) {
    LMIC_disableChannel(channel);
  }
  // Now, disable channels 16-72 (is there 72 ??)
  for (int channel = 9; channel < 72; ++channel) {
    LMIC_disableChannel(channel);
  }
  // This means only channels 8-15 are up

  // Disable link check validation
  LMIC_setLinkCheckMode(0);

  // Set data rate and transmit power (note: txpow seems to be ignored by the library)
  LMIC_setDrTxpow(DR_SF7, 14);

  // Start job
  do_send(&sendjob);
}

void loop() {
  smartdelay(1000);
  os_runloop_once();
}

static void smartdelay(unsigned long ms) {
  unsigned long start = millis();
  do {
    while (ss.available()) {
      gps.encode(ss.read());
    }
  } while (millis() - start < ms);
}

void onEvent (ev_t ev) {
  Serial.print(os_getTime());
  Serial.print(": ");
  switch (ev) {
    case EV_SCAN_TIMEOUT:
      Serial.println(F("EV_SCAN_TIMEOUT"));
      break;
    case EV_BEACON_FOUND:
      Serial.println(F("EV_BEACON_FOUND"));
      break;
    case EV_BEACON_MISSED:
      Serial.println(F("EV_BEACON_MISSED"));
      break;
    case EV_BEACON_TRACKED:
      Serial.println(F("EV_BEACON_TRACKED"));
      break;
    case EV_JOINING:
      Serial.println(F("EV_JOINING"));
      break;
    case EV_JOINED:
      Serial.println(F("EV_JOINED"));
      break;
    case EV_RFU1:
      Serial.println(F("EV_RFU1"));
      break;
    case EV_JOIN_FAILED:
      Serial.println(F("EV_JOIN_FAILED"));
      break;
    case EV_REJOIN_FAILED:
      Serial.println(F("EV_REJOIN_FAILED"));
      break;
      break;
    case EV_TXCOMPLETE:
      Serial.println(F("EV_TXCOMPLETE (includes waiting for RX windows)"));
      if (LMIC.dataLen) {
        // data received in rx slot after tx
        Serial.print(F("Data Received: "));
        Serial.write(LMIC.frame + LMIC.dataBeg, LMIC.dataLen);
        Serial.println();
      }
      // Schedule next transmission
      os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL), do_send);
      break;
    case EV_LOST_TSYNC:
      Serial.println(F("EV_LOST_TSYNC"));
      break;
    case EV_RESET:
      Serial.println(F("EV_RESET"));
      break;
    case EV_RXCOMPLETE:
      // data received in ping slot
      Serial.println(F("EV_RXCOMPLETE"));
      break;
    case EV_LINK_DEAD:
      Serial.println(F("EV_LINK_DEAD"));
      break;
    case EV_LINK_ALIVE:
      Serial.println(F("EV_LINK_ALIVE"));
      break;
    default:
      Serial.println(F("Unknown event"));
      break;
  }
}

void do_send(osjob_t* j) {
  // Check if there is not a current TX/RX job running
  if (LMIC.opmode & OP_TXRXPEND) {
    //Serial.println(F("OP_TXRXPEND, not sending"));
    Serial.print("OP_TXRXPEND, not sending; at freq: ");
    Serial.println(LMIC.freq);
  } else {
    float flat, flon;
    unsigned long age;
    gps.f_get_position(&flat, &flon, &age);
    lpp.reset();
    lpp.addGPS(3, flat, flon, gps.f_altitude());
    // Prepare upstream data transmission at the next possible time.
    LMIC_setTxData2(1, lpp.getBuffer(), lpp.getSize(), 0);
    Serial.print(F("Packet queued for freq: "));
  }
  // Next TX is scheduled after TX_COMPLETE event.
}
