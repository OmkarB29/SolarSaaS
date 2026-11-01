package com.mpc.model3d.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "rooftop")
public class RooftopProperties {

    private final Imagery imagery = new Imagery();
    private final Storage storage = new Storage();

    public Imagery getImagery() {
        return imagery;
    }

    public Storage getStorage() {
        return storage;
    }

    public static class Imagery {
        private final GoogleStatic googleStatic = new GoogleStatic();

        public GoogleStatic getGoogleStatic() {
            return googleStatic;
        }

        public static class GoogleStatic {
            private boolean enabled = false;
            private String key = "";

            public boolean isEnabled() {
                return enabled;
            }

            public void setEnabled(boolean enabled) {
                this.enabled = enabled;
            }

            public String getKey() {
                return key;
            }

            public void setKey(String key) {
                this.key = key;
            }
        }
    }

    public static class Storage {
        private String glbDir = "uploads/models3d";

        public String getGlbDir() {
            return glbDir;
        }

        public void setGlbDir(String glbDir) {
            this.glbDir = glbDir;
        }
    }
}
