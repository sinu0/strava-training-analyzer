package pl.strava.analizator.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EncryptionUtilTest {

    private static final String HEX_KEY = "0123456789abcdef0123456789abcdef";
    private final EncryptionUtil util = new EncryptionUtil(HEX_KEY);

    @Test
    void encryptDecryptRoundtrip() {
        String original = "test-access-token-12345";
        String encrypted = util.encrypt(original);
        String decrypted = util.decrypt(encrypted);

        assertThat(decrypted).isEqualTo(original);
        assertThat(encrypted).isNotEqualTo(original);
    }

    @Test
    void encryptProducesDifferentCiphertextEachTime() {
        String original = "same-token";
        String encrypted1 = util.encrypt(original);
        String encrypted2 = util.encrypt(original);

        assertThat(encrypted1).isNotEqualTo(encrypted2);
        assertThat(util.decrypt(encrypted1)).isEqualTo(original);
        assertThat(util.decrypt(encrypted2)).isEqualTo(original);
    }

    @Test
    void nullInputReturnsNull() {
        assertThat(util.encrypt(null)).isNull();
        assertThat(util.decrypt(null)).isNull();
    }

    @Test
    void handlesEmptyString() {
        String encrypted = util.encrypt("");
        assertThat(util.decrypt(encrypted)).isEmpty();
    }
}
