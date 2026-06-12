package pl.dmcs.rkotas.springbootjsp_iwa2026.message.response;

public class JwtResponse {

    private String token;
    private String type = "Bearer";
    private String identifier;
    private String fullName;
    private boolean blocked;
    private String roles;

    public JwtResponse(String token, String identifier, String fullName, boolean blocked, String roles) {
        this.token = token;
        this.identifier = identifier;
        this.fullName = fullName;
        this.blocked = blocked;
        this.roles = roles;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }

    public String getRoles() {
        return roles;
    }

    public void setRoles(String roles) {
        this.roles = roles;
    }
}
