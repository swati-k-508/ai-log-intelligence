import random
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# 20 Heterogeneous Log Sources Definitions
LOG_SOURCES: List[Dict[str, Any]] = [
    {
        "id": "apache",
        "name": "Apache HTTP Server",
        "category": "Web Server",
        "icon": "Server",
        "format": "Syslog / Common Log Format",
        "badge_class": "badge-syslog",
        "volume": "High volume",
        "frequency_ms": 1000,
        "default_status": "STREAMING",
        "description": "NCSA HTTP Access and Web Server traffic logs"
    },
    {
        "id": "nginx",
        "name": "Nginx Web Server",
        "category": "Web Server",
        "icon": "Globe",
        "format": "Nginx Error / Access",
        "badge_class": "badge-syslog",
        "volume": "High volume",
        "frequency_ms": 1200,
        "default_status": "LIVE",
        "description": "Nginx edge proxy and upstream server error events"
    },
    {
        "id": "linux",
        "name": "Linux System (SSHD)",
        "category": "Operating System",
        "icon": "Terminal",
        "format": "RFC 3164 Syslog",
        "badge_class": "badge-syslog",
        "volume": "Continuous",
        "frequency_ms": 2000,
        "default_status": "LIVE",
        "description": "Linux kernel, systemd, and OpenSSH auth events"
    },
    {
        "id": "windows",
        "name": "Windows Event Log",
        "category": "Operating System",
        "icon": "Cpu",
        "format": "Key-Value / EventLog",
        "badge_class": "badge-kv",
        "volume": "Medium volume",
        "frequency_ms": 2500,
        "default_status": "LIVE",
        "description": "Windows Security Event ID 4625 & System Audits"
    },
    {
        "id": "mysql",
        "name": "MySQL Database",
        "category": "Database",
        "icon": "Database",
        "format": "MySQL Error Log",
        "badge_class": "badge-bracketed",
        "volume": "Medium volume",
        "frequency_ms": 3000,
        "default_status": "LIVE",
        "description": "RDBMS connection authentication and slow queries"
    },
    {
        "id": "postgres",
        "name": "PostgreSQL DB",
        "category": "Database",
        "icon": "Database",
        "format": "PostgreSQL CSV / Log",
        "badge_class": "badge-bracketed",
        "volume": "Medium volume",
        "frequency_ms": 3200,
        "default_status": "LIVE",
        "description": "Postgres transaction logs, locks, and client connections"
    },
    {
        "id": "mongodb",
        "name": "MongoDB Enterprise",
        "category": "NoSQL Database",
        "icon": "Database",
        "format": "JSON Lines",
        "badge_class": "badge-json",
        "volume": "Medium volume",
        "frequency_ms": 2800,
        "default_status": "LIVE",
        "description": "Document DB command execution and cluster health"
    },
    {
        "id": "docker",
        "name": "Docker Daemon",
        "category": "Container",
        "icon": "Box",
        "format": "Docker Stdout / Stderr",
        "badge_class": "badge-syslog",
        "volume": "High volume",
        "frequency_ms": 1500,
        "default_status": "LIVE",
        "description": "Container runtime logs, restarts, and OOM events"
    },
    {
        "id": "kubernetes",
        "name": "Kubernetes Cluster",
        "category": "Orchestration",
        "icon": "Layers",
        "format": "JSON Audit / K8s Event",
        "badge_class": "badge-json",
        "volume": "Cluster Event",
        "frequency_ms": 2200,
        "default_status": "LIVE",
        "description": "Kubelet, pod crashes, and RBAC control plane audits"
    },
    {
        "id": "aws_cloudtrail",
        "name": "AWS CloudTrail",
        "category": "Cloud Infrastructure",
        "icon": "Cloud",
        "format": "JSON Lines",
        "badge_class": "badge-json",
        "volume": "High volume",
        "frequency_ms": 1800,
        "default_status": "LIVE",
        "description": "AWS API calls, IAM role usage, and STS tokens"
    },
    {
        "id": "firewall",
        "name": "Perimeter Firewall",
        "category": "Network Security",
        "icon": "Shield",
        "format": "Key-Value Pipe",
        "badge_class": "badge-kv",
        "volume": "Very high volume",
        "frequency_ms": 800,
        "default_status": "STREAMING",
        "description": "Enterprise Palo Alto / Fortinet DENY & ALLOW traffic logs"
    },
    {
        "id": "network",
        "name": "Network Devices",
        "category": "Network Hardware",
        "icon": "Network",
        "format": "Cisco Syslog",
        "badge_class": "badge-syslog",
        "volume": "High frequency",
        "frequency_ms": 1900,
        "default_status": "LIVE",
        "description": "Core switch link status, BGP flaps, and port security"
    },
    {
        "id": "api_gateway",
        "name": "API Gateway",
        "category": "API Management",
        "icon": "Zap",
        "format": "JSON Lines",
        "badge_class": "badge-json",
        "volume": "Burst traffic",
        "frequency_ms": 1400,
        "default_status": "LIVE",
        "description": "Kong / Envoy ingress proxy request latency and status"
    },
    {
        "id": "auth_service",
        "name": "Authentication Service",
        "category": "Identity & IAM",
        "icon": "Lock",
        "format": "JSON Lines",
        "badge_class": "badge-json",
        "volume": "Event-based",
        "frequency_ms": 2600,
        "default_status": "LIVE",
        "description": "Keycloak / Auth0 MFA attempts, JWT validation & logins"
    },
    {
        "id": "app_server",
        "name": "Application Server",
        "category": "Middleware",
        "icon": "Activity",
        "format": "Bracketed Java Log",
        "badge_class": "badge-bracketed",
        "volume": "Continuous",
        "frequency_ms": 2100,
        "default_status": "LIVE",
        "description": "Spring Boot / Enterprise JVM application traces"
    },
    {
        "id": "dns_server",
        "name": "DNS Server",
        "category": "Network Core",
        "icon": "Globe",
        "format": "BIND / Query Log",
        "badge_class": "badge-syslog",
        "volume": "High frequency",
        "frequency_ms": 1100,
        "default_status": "LIVE",
        "description": "Internal BIND 9 query logs and malicious domain flags"
    },
    {
        "id": "load_balancer",
        "name": "Load Balancer (ALB)",
        "category": "Cloud Infrastructure",
        "icon": "GitBranch",
        "format": "AWS ALB Log",
        "badge_class": "badge-syslog",
        "volume": "High volume",
        "frequency_ms": 1300,
        "default_status": "LIVE",
        "description": "AWS Elastic Load Balancer HTTP/HTTPS target status"
    },
    {
        "id": "security_events",
        "name": "EDR Security Agent",
        "category": "Endpoint Security",
        "icon": "ShieldAlert",
        "format": "Custom EDR Format",
        "badge_class": "badge-custom",
        "volume": "Event-based",
        "frequency_ms": 3500,
        "default_status": "LIVE",
        "description": "CrowdStrike / Defender process injection & malware alerts"
    },
    {
        "id": "web_app",
        "name": "Web Application",
        "category": "Application",
        "icon": "Layout",
        "format": "Bracketed Apache Log",
        "badge_class": "badge-bracketed",
        "volume": "Medium volume",
        "frequency_ms": 2400,
        "default_status": "LIVE",
        "description": "Frontend session exceptions, CSRF flags & API calls"
    },
    {
        "id": "custom_app",
        "name": "Custom Enterprise App",
        "category": "Custom Plugin",
        "icon": "Code",
        "format": "Custom Pipe Format",
        "badge_class": "badge-custom",
        "volume": "Medium volume",
        "frequency_ms": 3000,
        "default_status": "LIVE",
        "description": "Custom legacy banking transaction logs parsed by ULPF regex"
    }
]

# Track live counters per source in memory
LIVE_COUNTERS: Dict[str, int] = {s["id"]: random.randint(180, 1450) for s in LOG_SOURCES}

# System Scenario Catalog for the Command Centers
SYSTEM_SCENARIOS: Dict[str, List[Dict[str, str]]] = {
    "apache": [
        {"id": "normal", "name": "Routine HTTP Traffic", "type": "normal", "desc": "Standard GET/POST 200 OK access"},
        {"id": "sqli", "name": "SQL Injection Probe", "type": "attack", "desc": "' UNION SELECT username,password FROM users"},
        {"id": "traversal", "name": "Directory Traversal", "type": "attack", "desc": "Access attempt for /etc/passwd"},
        {"id": "ddos", "name": "HTTP Flood / Spike", "type": "stress", "desc": "Rapid burst of 500 error requests"}
    ],
    "nginx": [
        {"id": "normal", "name": "Normal Proxy Pass", "type": "normal", "desc": "Upstream proxy 200 responses"},
        {"id": "upstream_timeout", "name": "504 Gateway Timeout", "type": "stress", "desc": "Upstream backend microservice unreachable"},
        {"id": "rate_limit", "name": "Rate Limit Exceeded", "type": "warning", "desc": "Client IP exceeded request zone limit"},
        {"id": "buffer_overflow", "name": "Large Body Exploit", "type": "attack", "desc": "Client intended to send too large body"}
    ],
    "linux": [
        {"id": "normal", "name": "Routine Syslog Activity", "type": "normal", "desc": "Systemd services & accepted logins"},
        {"id": "brute_force", "name": "SSH Password Brute Force", "type": "attack", "desc": "Repeated Failed password for root"},
        {"id": "priv_esc", "name": "Root Privilege Escalation", "type": "attack", "desc": "sudo su - executed by sysadmin"},
        {"id": "oom", "name": "Kernel OOM Killer", "type": "warning", "desc": "Out of memory killing process java"}
    ],
    "windows": [
        {"id": "normal", "name": "Kerberos User Logon", "type": "normal", "desc": "Event ID 4624 successful logon"},
        {"id": "auth_failure", "name": "Event 4625 Bad Password", "type": "attack", "desc": "Account logon failure / password spray"},
        {"id": "admin_priv", "name": "Event 4672 Special Privileges", "type": "warning", "desc": "Administrator rights assigned to session"},
        {"id": "service_install", "name": "Event 7045 New Service", "type": "warning", "desc": "New unverified service installed"}
    ],
    "mysql": [
        {"id": "normal", "name": "Normal DB Query Execution", "type": "normal", "desc": "SELECT query on product tables"},
        {"id": "auth_denied", "name": "Access Denied (Bad Password)", "type": "attack", "desc": "Access denied for user root@192.168.1.105"},
        {"id": "slow_query", "name": "Slow Query Lock (>5s)", "type": "stress", "desc": "Query lock on order transactions table"},
        {"id": "table_crash", "name": "Table Corruption Warning", "type": "warning", "desc": "InnoDB table space warning"}
    ],
    "postgres": [
        {"id": "normal", "name": "Transaction Commit", "type": "normal", "desc": "Normal PostgreSQL statement execution"},
        {"id": "exfil", "name": "Massive Data Exfiltration", "type": "attack", "desc": "SELECT * FROM credit_cards LIMIT 1000000"},
        {"id": "deadlock", "name": "Deadlock Detected", "type": "stress", "desc": "Transaction aborted due to lock contention"}
    ],
    "mongodb": [
        {"id": "normal", "name": "Document Read / Write", "type": "normal", "desc": "BSON document query completed in 4ms"},
        {"id": "auth_fail", "name": "SCRAM Auth Failure", "type": "attack", "desc": "Authentication failure on admin db"},
        {"id": "slow_op", "name": "Slow Aggregation Pipeline", "type": "stress", "desc": "Aggregation duration 480ms without index"}
    ],
    "docker": [
        {"id": "normal", "name": "Container Healthy", "type": "normal", "desc": "Container started and healthcheck passed"},
        {"id": "oom", "name": "Container OOMKilled", "type": "warning", "desc": "Out of memory in web-worker container"},
        {"id": "port_conflict", "name": "Port Binding Failure", "type": "stress", "desc": "Failed to bind port 8080: address in use"}
    ],
    "kubernetes": [
        {"id": "normal", "name": "Pod Scheduled", "type": "normal", "desc": "Pod successfully scheduled on worker-node-03"},
        {"id": "crash_loop", "name": "CrashLoopBackOff", "type": "stress", "desc": "Container in pod auth-service continuously failing"},
        {"id": "rbac_violation", "name": "Unauthorized Kube-API Call", "type": "attack", "desc": "Forbidden GET /api/v1/secrets for serviceaccount"}
    ],
    "aws_cloudtrail": [
        {"id": "normal", "name": "Console Login (MFA OK)", "type": "normal", "desc": "ConsoleLogin with MFA authentication"},
        {"id": "unauth_iam", "name": "Unauthorized Policy Attach", "type": "attack", "desc": "AttachRolePolicy AdministratorAccess denied"},
        {"id": "open_sg", "name": "Open 0.0.0.0/0 Security Group", "type": "warning", "desc": "AuthorizeSecurityGroupIngress port 22 open"}
    ],
    "firewall": [
        {"id": "normal", "name": "Traffic ALLOW", "type": "normal", "desc": "Outbound HTTPS permit rule triggered"},
        {"id": "port_scan", "name": "Reconnaissance Port Scan", "type": "attack", "desc": "SYN sweep against ports 22, 80, 443, 3389"},
        {"id": "c2_deny", "name": "C2 Botnet IP Drop", "type": "attack", "desc": "Perimeter DENY for malicious IP 198.51.100.4"}
    ],
    "network": [
        {"id": "normal", "name": "Interface Up / BGP Converged", "type": "normal", "desc": "GigabitEthernet0/1 link UP status"},
        {"id": "port_sec", "name": "Port Security MAC Violation", "type": "attack", "desc": "Unauthorized MAC address blocked on port 4"},
        {"id": "bgp_flap", "name": "BGP Route Flap", "type": "stress", "desc": "BGP peer 10.254.0.1 changed state to Down"}
    ],
    "api_gateway": [
        {"id": "normal", "name": "API Request 200 OK", "type": "normal", "desc": "POST /api/v1/payments returned in 24ms"},
        {"id": "cred_stuff", "name": "Credential Stuffing (429)", "type": "attack", "desc": "Rate limit exceeded on /api/v1/auth/login"},
        {"id": "unauth_api", "name": "Unauthorized Endpoint (401)", "type": "attack", "desc": "GET /api/v1/admin/keys without token"}
    ],
    "auth_service": [
        {"id": "normal", "name": "Keycloak SSO Login", "type": "normal", "desc": "JWT token issued for user sysadmin"},
        {"id": "mfa_fail", "name": "MFA Challenge Failed", "type": "attack", "desc": "Invalid TOTP passcode 5 consecutive times"},
        {"id": "token_forgery", "name": "Forged JWT Signature", "type": "attack", "desc": "Token verification failed: invalid signature"}
    ],
    "app_server": [
        {"id": "normal", "name": "Spring Service Trace", "type": "normal", "desc": "OrderService processed transaction successfully"},
        {"id": "latency_spike", "name": "Latency Threshold Exceeded", "type": "stress", "desc": "PaymentGateway latency > 3500ms"},
        {"id": "null_pointer", "name": "Unhandled NullPointerException", "type": "warning", "desc": "Null pointer in UserService.authenticate"}
    ],
    "dns_server": [
        {"id": "normal", "name": "Standard DNS A Query", "type": "normal", "desc": "Query for api.nexora.com resolved to 10.0.0.1"},
        {"id": "dns_tunnel", "name": "C2 DNS Tunneling Exfiltration", "type": "attack", "desc": "Query for data.exfil.a98f12.botnet.org IN TXT"},
        {"id": "nxdomain", "name": "DGA NXDOMAIN Storm", "type": "stress", "desc": "Burst of non-existent random domain queries"}
    ],
    "load_balancer": [
        {"id": "normal", "name": "ALB Target Health 200 OK", "type": "normal", "desc": "Round-robin traffic forward to 10.0.1.25"},
        {"id": "502_bad_gw", "name": "502 Bad Gateway Burst", "type": "stress", "desc": "All target instances failing healthcheck"},
        {"id": "slow_client", "name": "Slowloris Incomplete Request", "type": "attack", "desc": "Client socket timeout before HTTP header complete"}
    ],
    "security_events": [
        {"id": "normal", "name": "Routine Process Execution", "type": "normal", "desc": "explorer.exe spawned notepad.exe (PID 4920)"},
        {"id": "mimikatz", "name": "LSASS Memory Dump Attempt", "type": "attack", "desc": "Mimikatz tool attempted to read lsass.exe"},
        {"id": "powershell_enc", "name": "Obfuscated PowerShell Execution", "type": "attack", "desc": "powershell.exe -EncodedCommand SQBFAFgA..."},
        {"id": "dll_inject", "name": "Process Injection / Hooking", "type": "attack", "desc": "Unverified DLL injected into svchost.exe"}
    ],
    "web_app": [
        {"id": "normal", "name": "User Session Active", "type": "normal", "desc": "Session active for user_1024"},
        {"id": "csrf_fail", "name": "CSRF Token Validation Failed", "type": "attack", "desc": "Origin header mismatch in state-changing POST"},
        {"id": "xss_probe", "name": "Stored XSS Payload Blocked", "type": "attack", "desc": "Sanitized <script>alert(document.cookie)</script>"}
    ],
    "custom_app": [
        {"id": "normal", "name": "Banking Tx Completed", "type": "normal", "desc": "Core banking debit transaction verified"},
        {"id": "limit_bypass", "name": "Withdrawal Limit Bypass Attempt", "type": "attack", "desc": "EVENT=LimitBypassAttempt | AMOUNT=5000000"},
        {"id": "sync_fail", "name": "Ledger Replication Sync Error", "type": "stress", "desc": "Distributed transaction ledger out of sync"}
    ]
}

def generate_log_line_for_source(source_id: str, scenario: Optional[str] = None) -> str:
    now_utc = datetime.now(timezone.utc)
    ts_iso = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
    ts_syslog = now_utc.strftime("%b %d %H:%M:%S")
    ts_ncsa = now_utc.strftime("%d/%b/%Y:%H:%M:%S +0000")
    ts_win = now_utc.strftime("%Y-%m-%d %H:%M:%S")
    
    ips = ["192.168.1.105", "10.0.4.22", "172.16.0.88", "198.51.100.4", "192.168.1.50", "10.0.1.15", "192.168.1.20"]
    users = ["admin", "user_1024", "root", "service_account", "jdoe", "db_admin", "sysadmin"]
    ip = random.choice(ips)
    user = random.choice(users)

    # Specific Scenario Overrides
    if scenario:
        sc = scenario.lower()
        if source_id == "apache":
            if sc == "sqli":
                return f'198.51.100.4 - - [{ts_ncsa}] "GET /api/products?id=1%27%20UNION%20SELECT%20username,password%20FROM%20users-- HTTP/1.1" 403 489'
            elif sc == "traversal":
                return f'172.16.0.88 - - [{ts_ncsa}] "GET /../../../../etc/passwd HTTP/1.1" 403 320'
            elif sc == "ddos":
                return f'{ip} - - [{ts_ncsa}] "POST /api/v1/checkout HTTP/1.1" 500 1250'
        
        elif source_id == "nginx":
            if sc == "upstream_timeout":
                return f"{ts_win} [error] 2451#2451: *912 upstream timed out (110: Connection timed out) while connecting to upstream, client: {ip}, server: api.nexora.com"
            elif sc == "rate_limit":
                return f"{ts_win} [warn] 2451#2451: *814 limiting requests, excess: 5.200 by zone 'api_rate_limit', client: 198.51.100.4, server: api.nexora.com"
            elif sc == "buffer_overflow":
                return f"{ts_win} [crit] 2451#2451: *412 client intended to send too large body: 104857600 bytes, client: 172.16.0.88, server: api.nexora.com"

        elif source_id == "linux":
            if sc == "brute_force":
                return f"{ts_syslog} nexora-srv01 sshd[{random.randint(1000, 9999)}]: Failed password for invalid user root from 198.51.100.4 port {random.randint(30000, 60000)} ssh2"
            elif sc == "priv_esc":
                return f"{ts_syslog} nexora-srv01 sudo: sysadmin : TTY=pts/2 ; PWD=/root ; USER=root ; COMMAND=/bin/bash"
            elif sc == "oom":
                return f"{ts_syslog} nexora-srv01 kernel: [ {random.randint(100, 999)}.123456] Out of memory: Kill process {random.randint(1000, 9999)} (java) score 890"

        elif source_id == "windows":
            if sc == "auth_failure":
                return f"{ts_win} EventID=4625 Level=Warning Computer=DC01.NEXORA.LOCAL User=Administrator Workstation=WS-ATTACK IP=198.51.100.4 Status=0xC000006D"
            elif sc == "admin_priv":
                return f"{ts_win} EventID=4672 Level=Information Computer=DC01.NEXORA.LOCAL User=sysadmin Workstation=DC01 IP=10.0.1.15 Privileges=SeDebugPrivilege,SeTcbPrivilege"

        elif source_id == "aws_cloudtrail":
            if sc == "unauth_iam":
                return f'{{"eventTime":"{ts_iso}","eventName":"AttachRolePolicy","awsRegion":"us-east-1","sourceIPAddress":"198.51.100.4","userName":"attacker_user","status":"AccessDenied","policyArn":"arn:aws:iam::aws:policy/AdministratorAccess"}}'
            elif sc == "open_sg":
                return f'{{"eventTime":"{ts_iso}","eventName":"AuthorizeSecurityGroupIngress","awsRegion":"us-east-1","sourceIPAddress":"10.0.1.15","userName":"sysadmin","status":"SUCCESS","cidrBlock":"0.0.0.0/0","port":22}}'

        elif source_id == "firewall":
            if sc == "port_scan":
                return f"timestamp={ts_iso} action=DENY src_ip=172.16.0.88 dst_ip=10.0.0.5 port={random.choice([21,22,23,80,443,3389,8080])} proto=TCP interface=eth0 reason=SYN_SCAN_DETECTED"
            elif sc == "c2_deny":
                return f"timestamp={ts_iso} action=DENY src_ip=198.51.100.4 dst_ip=10.0.0.12 port=443 proto=TCP interface=eth0 threat_intel=MALICIOUS_C2_DROP"

        elif source_id == "security_events":
            if sc == "mimikatz":
                return f"{ts_win} [ALERT] EDR Agent: Mimikatz credential dumping detected targeting lsass.exe on host WS-FINANCE IP=10.0.4.22 (Severity=CRITICAL)"
            elif sc == "powershell_enc":
                return f"{ts_win} [ALERT] EDR Agent: Obfuscated PowerShell execution: powershell.exe -NonI -W Hidden -Enc SQBFAFgA (Host=WS-DEV IP=198.51.100.4)"

        elif source_id == "mysql":
            if sc == "auth_denied":
                return f"{ts_iso} [ERROR] Access denied for user 'root'@'198.51.100.4' (using password: YES) on database 'nexora_core'"
            elif sc == "slow_query":
                return f"{ts_iso} [Warning] Query execution time (8450ms) exceeded threshold for client {ip}: SELECT * FROM transactions_archive WHERE status='PENDING'"

        elif source_id == "postgres":
            if sc == "exfil":
                return f"{ts_win}.120 UTC [4891] LOG: statement: SELECT * FROM credit_cards LIMIT 1000000; client=198.51.100.4"
            elif sc == "deadlock":
                return f"{ts_win}.340 UTC [4902] ERROR: deadlock detected between transaction tx_981 and tx_982; client={ip}"

        elif source_id == "mongodb":
            if sc == "auth_fail":
                return f'{{"t":{{"$date":"{ts_iso}"}},"s":"W","c":"ACCESS","id":20249,"ctx":"conn81","msg":"Authentication failed","attr":{{"mechanism":"SCRAM-SHA-256","user":"root","client":"198.51.100.4","error":"AuthenticationFailed"}}}}'
            elif sc == "slow_op":
                return f'{{"t":{{"$date":"{ts_iso}"}},"s":"I","c":"COMMAND","id":21532,"ctx":"conn12","msg":"Slow query","attr":{{"durationMillis":1480,"user":"admin","client":"{ip}"}}}}'

        elif source_id == "docker":
            if sc == "oom":
                return f"{ts_iso} container=web-worker-3 std=stderr Out of memory in container web-worker (allocated 2048MB, killed by kernel)"
            elif sc == "port_conflict":
                return f"{ts_iso} container=api-gateway-1 std=stderr Failed to bind port 8080: address already in use"

        elif source_id == "kubernetes":
            if sc == "rbac_violation":
                return f'{{"timestamp":"{ts_iso}","pod":"unauth-runner-9b","namespace":"default","level":"error","event":"Forbidden","msg":"User cannot list secrets at cluster scope","ip":"172.16.0.88"}}'
            elif sc == "crash_loop":
                return f'{{"timestamp":"{ts_iso}","pod":"auth-service-5b7x","namespace":"prod","level":"error","event":"CrashLoopBackOff","ip":"{ip}"}}'

        elif source_id == "dns_server":
            if sc == "dns_tunnel":
                return f"{ts_syslog} named[{random.randint(1000,9999)}]: client @0x7f81a 198.51.100.4#54321 (c2-data-exfil-chunk-912.malicious-c2.org): query: c2-data-exfil-chunk-912.malicious-c2.org IN TXT + (10.0.0.1)"
            elif sc == "nxdomain":
                return f"{ts_syslog} named[{random.randint(1000,9999)}]: client @0x7f81a 172.16.0.88#49120 (a98df71b2c4.dga-botnet.ru): query: a98df71b2c4.dga-botnet.ru IN A + (NXDOMAIN)"

        elif source_id == "api_gateway":
            if sc == "cred_stuff":
                return f'{{"timestamp":"{ts_iso}","method":"POST","endpoint":"/api/v1/auth/login","status":429,"latency":"890ms","client_ip":"198.51.100.4","msg":"Rate limit exceeded"}}'
            elif sc == "unauth_api":
                return f'{{"timestamp":"{ts_iso}","method":"GET","endpoint":"/api/v1/admin/keys","status":401,"latency":"12ms","client_ip":"172.16.0.88","msg":"Unauthorized token missing"}}'

        elif source_id == "auth_service":
            if sc == "mfa_fail":
                return f'{{"timestamp":"{ts_iso}","event":"MFA_CHALLENGE_FAILED","user":"admin","ip":"198.51.100.4","auth_provider":"keycloak","attempts":5}}'
            elif sc == "token_forgery":
                return f'{{"timestamp":"{ts_iso}","event":"FORGED_JWT_SIGNATURE","user":"unknown","ip":"172.16.0.88","auth_provider":"keycloak","severity":"CRITICAL"}}'

        elif source_id == "web_app":
            if sc == "csrf_fail":
                return f'[{ts_ncsa}] [ERROR] [client 198.51.100.4] CSRF token validation failed: origin header mismatch for session_id=sess_91823'
            elif sc == "xss_probe":
                return f'[{ts_ncsa}] [ERROR] [client 172.16.0.88] Stored XSS payload blocked: sanitized <script>alert(document.cookie)</script>'

        elif source_id == "custom_app":
            if sc == "limit_bypass":
                return f"[CUSTOM] {ts_win} | TRACE_ID=tx_9921 | COMPONENT=OrderEngine | EVENT=LimitBypassAttempt | AMOUNT=5000000 | USER=attacker"

    # Default Randomized Generators per Source
    if source_id == "apache":
        methods = ["GET", "POST", "PUT", "DELETE"]
        paths = ["/api/v1/users", "/login", "/dashboard", "/api/v1/checkout", "/health", "/admin/config"]
        status = random.choice([200, 200, 200, 304, 401, 403, 500])
        size = random.randint(200, 4800)
        return f'{ip} - - [{ts_ncsa}] "{random.choice(methods)} {random.choice(paths)} HTTP/1.1" {status} {size}'

    elif source_id == "nginx":
        err_levels = ["[error]", "[warn]", "[info]", "[crit]"]
        err_msg = random.choice([
            "connection refused while connecting to upstream",
            "client intended to send too large body",
            "upstream timed out (110: Connection timed out)",
            "worker process 2451 exited on signal 11",
            "limiting requests, excess: 5.200 by zone 'api_rate_limit'"
        ])
        return f"{ts_win} {random.choice(err_levels)} 2451#2451: *{random.randint(100, 999)} {err_msg}, client: {ip}, server: api.nexora.com"

    elif source_id == "linux":
        events = [
            f"sshd[{random.randint(1000, 9999)}]: Failed password for {user} from {ip} port {random.randint(30000, 60000)} ssh2",
            f"sshd[{random.randint(1000, 9999)}]: Accepted password for {user} from {ip} port {random.randint(30000, 60000)} ssh2",
            f"sudo: {user} : TTY=pts/1 ; PWD=/home/{user} ; USER=root ; COMMAND=/bin/bash",
            f"kernel: [ {random.randint(100, 999)}.123456] Out of memory: Kill process {random.randint(1000, 9999)} (java) score 850",
            f"systemd[1]: Started Daily apt download activities."
        ]
        return f"{ts_syslog} nexora-srv01 {random.choice(events)}"

    elif source_id == "windows":
        event_ids = [4625, 4624, 4672, 7036, 4688]
        eid = random.choice(event_ids)
        lvl = "Warning" if eid == 4625 else "Information"
        return f"{ts_win} EventID={eid} Level={lvl} Computer=DC01.NEXORA.LOCAL User={user} Workstation=WS-{random.randint(10,99)} IP={ip}"

    elif source_id == "mysql":
        errs = [
            f"[ERROR] Access denied for user '{user}'@'{ip}' (using password: YES)",
            f"[Warning] Aborted connection {random.randint(100,999)} to db: 'production' user: '{user}' host: '{ip}'",
            f"[Note] Plugin 'InnoDB' reporting option: table 'inventory/orders' size limit approaching threshold",
            f"[Note] Server hostname (bind-address): '0.0.0.0'; port: 3306"
        ]
        return f"{ts_iso} {random.choice(errs)}"

    elif source_id == "postgres":
        return f"{ts_win}.{random.randint(100,999)} UTC [{random.randint(1000,9999)}] LOG: statement: SELECT * FROM users WHERE user_id = '{user}'; client={ip}"

    elif source_id == "mongodb":
        msg = random.choice(["Slow query", "Authentication failure", "Connection accepted", "Replication heartbeat"])
        return f'{{"t":{{"$date":"{ts_iso}"}},"s":"I","c":"COMMAND","id":21532,"ctx":"conn{random.randint(10,99)}","msg":"{msg}","attr":{{"durationMillis":{random.randint(5,500)},"user":"{user}","client":"{ip}"}}}}'

    elif source_id == "docker":
        stream = random.choice(["stdout", "stderr"])
        err = random.choice([
            "Container started successfully", 
            "Failed to bind port 8080: address already in use", 
            "Database connection lost, retrying in 5s...", 
            "Out of memory in container web-worker (allocated 2048MB)",
            "Healthcheck endpoint /health returned status 200"
        ])
        return f"{ts_iso} container=app-service-{random.randint(1,5)} std={stream} {err}"

    elif source_id == "kubernetes":
        kind = random.choice(["OOMKilled", "CrashLoopBackOff", "PodScheduled", "ImagePullBackOff", "NodeReady"])
        return f'{{"timestamp":"{ts_iso}","pod":"auth-deploy-847b-xk{random.randint(1,9)}","namespace":"prod","level":"error","event":"{kind}","ip":"{ip}"}}'

    elif source_id == "aws_cloudtrail":
        action = random.choice(["ConsoleLogin", "CreateUser", "AttachRolePolicy", "AuthorizeSecurityGroupIngress", "GetCallerIdentity"])
        return f'{{"eventTime":"{ts_iso}","eventName":"{action}","awsRegion":"us-east-1","sourceIPAddress":"{ip}","userName":"{user}","status":"SUCCESS"}}'

    elif source_id == "firewall":
        actions = ["DENY", "ALLOW", "DROP", "RESET"]
        ports = [443, 80, 22, 3389, 8080, 53]
        return f"timestamp={ts_iso} action={random.choice(actions)} src_ip={ip} dst_ip=10.0.0.5 port={random.choice(ports)} proto=TCP interface=eth0"

    elif source_id == "network":
        subsys = random.choice(["%LINK-3-UPDOWN", "%PORT_SECURITY-2-PSEC_VIOLATION", "%BGP-5-ADJCHANGE", "%SYS-5-CONFIG_I"])
        return f"<134>{ts_syslog} cisco-core-sw01 {subsys}: Interface GigabitEthernet0/{random.randint(1,24)}, changed state to down (mac_src=00:1A:2B:3C:4D:5E)"

    elif source_id == "api_gateway":
        status = random.choice([200, 200, 201, 400, 401, 429, 500, 503])
        return f'{{"timestamp":"{ts_iso}","method":"POST","endpoint":"/api/v1/payments","status":{status},"latency":"{random.randint(15,850)}ms","client_ip":"{ip}"}}'

    elif source_id == "auth_service":
        evt = random.choice(["LOGIN_SUCCESS", "LOGIN_FAILED", "MFA_REQUIRED", "TOKEN_EXPIRED", "PASSWORD_RESET_REQ"])
        return f'{{"timestamp":"{ts_iso}","event":"{evt}","user":"{user}","ip":"{ip}","auth_provider":"keycloak"}}'

    elif source_id == "app_server":
        return f"{ts_win}.{random.randint(100,999)} [WARN] app.services.PaymentGateway: Payment processing latency threshold exceeded (tx_id=tx_{random.randint(10000,99999)})"

    elif source_id == "dns_server":
        domain = random.choice(["api.nexora.com", "malicious-c2-domain.com", "db-cluster.internal", "cdn.cloudflare.net", "telemetry.cloud.local"])
        return f"{ts_syslog} client @0x7f81a {ip}#{random.randint(30000,60000)} ({domain}): query: {domain} IN A +E(0)K (10.0.0.1)"

    elif source_id == "load_balancer":
        return f'http {ts_iso} alb-public-prod {ip}:{random.randint(30000,60000)} 10.0.1.25:80 0.001 0.045 0.000 {random.choice([200,200,502,504])} 200 245 890 "GET http://api.nexora.com:80/health HTTP/1.1"'

    elif source_id == "security_events":
        return f"{ts_win} [ALERT] EDR Agent: Suspicious PowerShell process spawned from cmd.exe (PID {random.randint(1000,9999)}) on host WS-{user} IP={ip}"

    elif source_id == "web_app":
        return f'[{ts_ncsa}] [ERROR] [client {ip}] CSRF token validation failed for session_id=sess_{random.randint(100000,999999)}'

    else:
        # custom_app
        return f"[CUSTOM] {ts_win} | TRACE_ID=tx_{random.randint(1000,9999)} | COMPONENT=OrderEngine | EVENT=StockAllocationFailed | ITEM_ID={random.randint(100,999)} | USER={user}"

def generate_logs_for_source(source_id: str, count: int = 1, scenario: Optional[str] = None) -> List[str]:
    logs = []
    for _ in range(count):
        logs.append(generate_log_line_for_source(source_id, scenario=scenario))
        LIVE_COUNTERS[source_id] = LIVE_COUNTERS.get(source_id, 0) + 1
    return logs

def get_all_sources_metadata() -> List[Dict[str, Any]]:
    result = []
    for s in LOG_SOURCES:
        sid = s["id"]
        sample = generate_log_line_for_source(sid)
        scenarios = SYSTEM_SCENARIOS.get(sid, [
            {"id": "normal", "name": "Normal Event", "type": "normal", "desc": "Standard system operation"},
            {"id": "warning", "name": "System Alert", "type": "warning", "desc": "Warning / Exception event"}
        ])
        result.append({
            **s,
            "logs_generated": LIVE_COUNTERS.get(sid, 0),
            "sample_log": sample,
            "scenarios": scenarios,
            "status": s["default_status"]
        })
    return result
