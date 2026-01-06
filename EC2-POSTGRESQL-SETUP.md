# PostgreSQL on EC2 vs RDS - Comparison & Setup Guide

## Table of Contents
1. [RDS vs EC2 Comparison](#rds-vs-ec2-comparison)
2. [When to Use EC2](#when-to-use-ec2)
3. [When to Use RDS](#when-to-use-rds)
4. [Cost Comparison](#cost-comparison)
5. [PostgreSQL on EC2 Setup Guide](#postgresql-on-ec2-setup-guide)
6. [Security Hardening](#security-hardening)
7. [High Availability Setup](#high-availability-setup)
8. [Backup Strategy](#backup-strategy)
9. [Monitoring](#monitoring)

---

## RDS vs EC2 Comparison

### Quick Decision Matrix

| Requirement | EC2 | RDS |
|-------------|-----|-----|
| **Full Control** | ✅ Complete control | ❌ AWS-managed |
| **Cost** | ✅ Cheaper for large databases | ⚠️ More expensive |
| **Maintenance** | ❌ Manual patching/upgrades | ✅ Automatic |
| **Setup Time** | ⚠️ Hours of configuration | ✅ Minutes |
| **Scalability** | ⚠️ Manual scaling | ✅ One-click scaling |
| **High Availability** | ⚠️ Complex setup | ✅ Built-in Multi-AZ |
| **Backups** | ⚠️ Manual setup | ✅ Automated |
| **Monitoring** | ⚠️ Self-managed | ✅ CloudWatch integrated |
| **Replication** | ⚠️ Manual setup | ✅ Read replicas |
| **Extensions** | ✅ Any extension | ⚠️ Limited set |
| **Custom Configs** | ✅ Full access | ⚠️ Parameter groups only |
| **Compliance** | ⚠️ Self-managed | ✅ AWS compliance ready |

---

## When to Use EC2

### ✅ Choose EC2 if:

1. **Budget Constraints**
   - Large database (>500GB) where RDS becomes expensive
   - Need to optimize every dollar of spend
   - Already have EC2 expertise in team

2. **Full Control Required**
   - Need custom PostgreSQL extensions not in RDS
   - Require OS-level access and tuning
   - Want custom kernel configurations
   - Need to install additional software on DB server

3. **Complex Replication Needs**
   - Multi-master replication
   - Custom replication topologies
   - Cross-cloud replication

4. **Compliance Requirements**
   - Data residency requirements
   - Custom encryption at application level
   - Specific audit logging requirements

5. **Development/Staging**
   - Non-production environments
   - Cost-sensitive projects
   - Learning/educational purposes

---

## When to Use RDS

### ✅ Choose RDS if:

1. **Production Environment**
   - Critical business data
   - Need 99.99% uptime SLA
   - Limited DBA resources

2. **Small to Medium Database**
   - Less than 500GB
   - Standard usage patterns
   - No special extensions needed

3. **Focus on Application**
   - Want to minimize DB management
   - Small team/limited resources
   - Need quick time-to-market

4. **Compliance Required**
   - Need AWS compliance certifications
   - Automated backups required
   - Easy disaster recovery

5. **Scalability Needs**
   - Expect rapid growth
   - Need easy vertical/horizontal scaling
   - Want read replicas

---

## Cost Comparison

### Scenario: 16GB RAM, 4 vCPU (db.m6g.xlarge equivalent)

| Service | Instance | Monthly Cost | Storage (100GB) | Total |
|---------|----------|--------------|-----------------|-------|
| **RDS Multi-AZ** | db.m6g.xlarge | ~$550 | ~$10 | ~$560 |
| **RDS Single-AZ** | db.m6g.xlarge | ~$275 | ~$10 | ~$285 |
| **EC2** | m6g.xlarge | ~$230 | ~$10 | ~$240 |
| **EC2 (Reserved)** | m6g.xlarge | ~$130 | ~$10 | ~$140 |

**Summary:**
- EC2 saves ~15-20% on compute costs
- Savings increase with larger instances
- But you lose automated maintenance, HA, backups

### Hidden Costs of EC2:
- ⚠️ DBA time for maintenance
- ⚠️ Monitoring setup (CloudWatch agents, Prometheus, etc.)
- ⚠️ Backup infrastructure (S3 storage, scripts)
- ⚠️ HA setup (additional EC2 instances, load balancers)
- ⚠️ Replication setup complexity

---

## PostgreSQL on EC2 Setup Guide

### Architecture

```
                    ┌─────────────────┐
                    │   Application   │
                    │   (EC2/ECS)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Security Group │
                    │   (Port 5432)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  EC2 Instance   │
                    │  PostgreSQL 16  │
                    │   Primary DB    │
                    └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  EBS Volumes    │
                    │  (gp3, 100 GB)  │
                    └─────────────────┘
```

---

### Step 1: Launch EC2 Instance

#### 1.1 Choose Instance Type

| Database Size | RAM | vCPU | Recommended Instance |
|---------------|-----|------|---------------------|
| < 50GB | 2-4 GB | 1-2 | t3.small / t3.medium |
| 50-200GB | 8 GB | 2 | t3.large / m6g.medium |
| 200-500GB | 16 GB | 4 | m6g.xlarge |
| 500GB-1TB | 32 GB | 8 | m6g.2xlarge |
| > 1TB | 64 GB+ | 16+ | m6g.4xlarg+ |

#### 1.2 Launch EC2 via Console

**AMI Selection:**
- Choose: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
- Or: Amazon Linux 2023

**Instance Type:**
- Development: `t3.medium` (2 vCPU, 4 GB RAM)
- Production: `m6g.xlarge` (4 vCPU, 16 GB RAM)

**Network:**
- VPC: Your VPC
- Subnet: Private subnet (recommended)
- Auto-assign Public IP: Disable (use private IP only)
- Security Group: Create new or select existing

**Storage:**
- Root Volume: 20 GB (gp3)
- Additional Volume: 100 GB+ (gp3) for database data

```bash
# Via AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \  # Ubuntu 22.04 in Mumbai
  --count 1 \
  --instance-type m6g.xlarge \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --block-device-mappings '[
    {
      "DeviceName": "/dev/xvda",
      "Ebs": {
        "VolumeSize": 20,
        "VolumeType": "gp3",
        "DeleteOnTermination": true
      }
    },
    {
      "DeviceName": "/dev/sdf",
      "Ebs": {
        "VolumeSize": 100,
        "VolumeType": "gp3",
        "DeleteOnTermination": false
      }
    }
  ]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=happytrip-b2b-db}]'
```

---

### Step 2: Configure Storage

#### 2.1 Format and Mount Additional Volume

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@EC2-PRIVATE-IP

# List volumes
lsblk

# Output:
# NAME    MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
# xvda    202:0    0  20G  0 disk /
# xvdf    202:80   0 100G  0 disk  <- This is our data volume

# Format volume (if new)
sudo mkfs -t xfs /dev/xvdf

# Create mount point
sudo mkdir -p /var/lib/postgresql

# Mount volume
sudo mount /dev/xvdf /var/lib/postgresql

# Get UUID
sudo blkid /dev/xvdf

# Output: UUID="xxxx-xxxx" TYPE="xfs"

# Add to fstab for auto-mount on reboot
sudo nano /etc/fstab

# Add this line (replace UUID):
UUID=xxxx-xxxx  /var/lib/postgresql  xfs  defaults,nofail  0  2

# Verify mount
sudo mount -a
df -h
```

---

### Step 3: Install PostgreSQL

#### 3.1 Install PostgreSQL 16

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Add repository key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Install PostgreSQL
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16 -y

# Verify installation
sudo -u postgres psql --version
# Output: psql (PostgreSQL) 16.x

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

#### 3.2 Verify Installation

```bash
# Check PostgreSQL is running
sudo -u postgres psql -c "SELECT version();"

# Check configuration directory
sudo -u postgres psql -c "SHOW config_file;"

# Check data directory
sudo -u postgres psql -c "SHOW data_directory;"
# Output: /var/lib/postgresql/16/main
```

---

### Step 4: Configure PostgreSQL

#### 4.1 Configure postgresql.conf

```bash
# Backup original config
sudo cp /etc/postgresql/16/main/postgresql.conf /etc/postgresql/16/main/postgresql.conf.backup

# Edit configuration
sudo nano /etc/postgresql/16/main/postgresql.conf
```

**Add/Modify these settings:**

```ini
#------------------------------------------------------------------------------
# CONNECTION SETTINGS
#------------------------------------------------------------------------------
listen_addresses = 'localhost,EC2-PRIVATE-IP'  # Listen on private IP
port = 5432
max_connections = 200

#------------------------------------------------------------------------------
# MEMORY SETTINGS (Adjust based on instance RAM)
#------------------------------------------------------------------------------
# For 16GB RAM instance:
shared_buffers = 4GB              # 25% of RAM
effective_cache_size = 12GB       # 75% of RAM
work_mem = 32MB                   # Per operation
maintenance_work_mem = 1GB

#------------------------------------------------------------------------------
# WRITE AHEAD LOG
#------------------------------------------------------------------------------
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min

#------------------------------------------------------------------------------
# QUERY PLANNING
#------------------------------------------------------------------------------
random_page_cost = 1.1            # For SSD storage
effective_io_concurrency = 200
default_statistics_target = 100

#------------------------------------------------------------------------------
# LOGGING
#------------------------------------------------------------------------------
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000  # Log slow queries > 1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_timezone = 'UTC'

#------------------------------------------------------------------------------
# ARCHIVE (for backups)
#------------------------------------------------------------------------------
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/16/main/archive/%f && cp %p /var/lib/postgresql/16/main/archive/%f'
archive_timeout = 300

#------------------------------------------------------------------------------
# OTHER
#------------------------------------------------------------------------------
timezone = 'UTC'
datestyle = 'iso, mdy'
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
default_text_search_config = 'pg_catalog.english'

#------------------------------------------------------------------------------
# SSL (Required for production)
#------------------------------------------------------------------------------
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
ssl_min_protocol_version = 'TLSv1.2'
```

#### 4.2 Configure pg_hba.conf (Client Authentication)

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

**Replace content with:**

```ini
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             app_user                                md5

# IPv4 local connections (from application servers)
host    all             app_user        10.0.0.0/16            md5
host    all             postgres        10.0.0.0/16            md5

# IPv6 local connections
host    all             all             ::1/128                 md5

# Replication connection (if needed)
host    replication     replicator      10.0.0.0/16            md5

# Reject everything else
host    all             all             0.0.0.0/0              reject
```

#### 4.3 Restart PostgreSQL

```bash
# Test configuration
sudo -u postgres psql -c "SHOW config_file;"

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check for errors
sudo tail -100 /var/log/postgresql/postgresql-*.log
```

---

### Step 5: Security Hardening

#### 5.1 Create Application User

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create application user
CREATE USER app_user WITH PASSWORD 'SecurePassword123!';
CREATE USER reporting_user WITH PASSWORD 'ReportPassword123!';

-- Create database
CREATE DATABASE happytrip_b2b OWNER app_user;

-- Connect to database
\c happytrip_b2b

-- Create schemas
CREATE SCHEMA app;
CREATE SCHEMA audit;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA app TO app_user;
GRANT ALL PRIVILEGES ON SCHEMA audit TO app_user;
GRANT ALL PRIVILEGES ON DATABASE happytrip_b2b TO app_user;

-- Create read-only user
GRANT CONNECT ON DATABASE happytrip_b2b TO reporting_user;
GRANT USAGE ON SCHEMA app TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO reporting_user;

-- Exit
\q
```

#### 5.2 Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow PostgreSQL from application servers
sudo ufw allow from 10.0.1.0/24 to any port 5432 proto tcp

# Check status
sudo ufw status numbered
```

#### 5.3 Configure Security Groups

```bash
# Update security group to allow PostgreSQL
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source 10.0.1.0/24  # Your application subnet
```

---

### Step 6: Performance Tuning

#### 6.1 Configure Linux Kernel Parameters

```bash
# Edit sysctl.conf
sudo nano /etc/sysctl.conf

# Add these lines:
# PostgreSQL performance tuning
kernel.shmmax = 68719476736          # 64GB in bytes
kernel.shmall = 4294967296           # shmmax / pagesize
kernel.sem = 250 32000 100 128
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 3

# Network tuning
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Apply changes
sudo sysctl -p
```

#### 6.2 Configure I/O Scheduler (for EBS)

```bash
# Check current scheduler
cat /sys/block/xvdf/queue/scheduler
# Output: [mq-deadline] none noop

# Set to deadline for EBS
echo deadline | sudo tee /sys/block/xvdf/queue/scheduler

# Make permanent
sudo nano /etc/rc.local
# Add before 'exit 0':
echo deadline > /sys/block/xvdf/queue/scheduler
```

---

### Step 7: Backup Setup

#### 7.1 Configure Automated Backups

```bash
# Create backup directory
sudo mkdir -p /var/lib/postgresql/backups
sudo chown postgres:postgres /var/lib/postgresql/backups

# Create backup script
sudo nano /usr/local/bin/pg-backup.sh
```

**Backup script content:**

```bash
#!/bin/bash
# PostgreSQL Backup Script
# Run daily via cron

# Configuration
BACKUP_DIR="/var/lib/postgresql/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
S3_BUCKET="s3://happytrip-b2b-backups"

# Create backup
sudo -u postgres pg_dumpall -U postgres | gzip > "$BACKUP_DIR/full_backup_$TIMESTAMP.sql.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/full_backup_$TIMESTAMP.sql.gz" "$S3_BUCKET/postgresql/"

# Delete old backups
find "$BACKUP_DIR" -name "full_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "Backup completed: full_backup_$TIMESTAMP.sql.gz" >> /var/log/postgresql/backup.log
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/pg-backup.sh

# Add to cron (daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /usr/local/bin/pg-backup.sh
```

#### 7.2 Configure Continuous Archiving (WAL)

```bash
# Create archive directory
sudo mkdir -p /var/lib/postgresql/16/main/archive
sudo chown postgres:postgres /var/lib/postgresql/16/main/archive

# Already configured in postgresql.conf
# Verify WAL archiving is working
sudo -u postgres psql -c "SHOW archive_mode;"
```

---

### Step 8: Monitoring Setup

#### 8.1 Install CloudWatch Agent

```bash
# Download and install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Create configuration
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/config.json
```

**Configuration:**

```json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "metrics": {
    "namespace": "HappyTripB2B/PostgreSQL",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_active", "cpu_usage_idle"],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["disk_used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      }
    }
  }
}
```

```bash
# Start CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s

# Enable CloudWatch logs
aws logs create-log-group --log-group-name /postgresql/happytrip-b2b

aws logs put-log-policy \
  --log-group-name /postgresql/happytrip_b2b \
  --policy-name "CloudWatchLogsAccess" \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"logs.amazonaws.com"},"Action":"logs:PutLogEvents","Resource":"arn:aws:logs:REGION:ACCOUNT_ID:log-group:/postgresql/happytrip_b2b"}]}'
```

#### 8.2 PostgreSQL Monitoring Query

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW pg_monitoring AS
SELECT
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') AS active_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') AS idle_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction') AS idle_in_transaction,
  (SELECT pg_database_size('happytrip_b2b') / 1024 / 1024 / 1024) AS db_size_gb,
  (SELECT sum(xact_commit) FROM pg_stat_database WHERE datname = 'happytrip_b2b') AS commits,
  (SELECT sum(xact_rollback) FROM pg_stat_database WHERE datname = 'happytrip_b2b') AS rollbacks,
  (SELECT sum(blks_hit) / NULLIF(sum(blks_hit + blks_read), 0) * 100 FROM pg_stat_database WHERE datname = 'happytrip_b2b') AS cache_hit_ratio;
```

---

## High Availability Setup

### Option 1: Hot Standby with Streaming Replication

```
┌──────────────┐         ┌──────────────┐
│   Primary    │───────▶ │   Standby    │
│   (Master)   │ WAL     │  (Replica)   │
│              │ Stream  │              │
└──────────────┘         └──────────────┘
     Writer                   Reader
```

#### 1.1 Configure Primary (on Master)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf

# Add/modify:
listen_addresses = '*'
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB
synchronous_commit = on
synchronous_standby_names = 'standby1'
```

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add replica connection:
host    replication     replicator      STANDBY-IP/32    md5
```

```bash
# Create replication user
sudo -u postgres psql
CREATE USER replicator REPLICATION LOGIN PASSWORD 'ReplicaPassword123!';
\q

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 1.2 Configure Standby (on Replica Instance)

```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Clean data directory
sudo rm -rf /var/lib/postgresql/16/main/*

# Run pg_basebackup
sudo -u postgres pg_basebackup \
  -h PRIMARY-IP \
  -D /var/lib/postgresql/16/main \
  -U replicator \
  -P \
  -v \
  -R \
  -X stream \
  -C -S standby1 \
  -W

# Start PostgreSQL
sudo systemctl start postgresql

# Verify replication
sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"
```

### Option 2: Auto-Failover with Patroni

```bash
# Install Patroni
sudo apt install python3-pip -y
sudo pip3 install patroni[etcd3]

# Create Patroni config
sudo nano /etc/patroni/patroni.yml
```

**Patroni Configuration:**

```yaml
scope: postgres-ha
name: postgresql-1

restapi:
  listen: 0.0.0.0:8008
  connect_address: PRIVATE-IP:8008

etcd3:
  hosts:
    - ETCD-ENDPOINT-1:2379
    - ETCD-ENDPOINT-2:2379
    - ETCD-ENDPOINT-3:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576

postgresql:
  listen: 0.0.0.0:5432
  connect_address: PRIVATE-IP:5432
  data_dir: /var/lib/postgresql/16/main
  bin_dir: /usr/lib/postgresql/16/bin

  authentication:
    replication:
      username: replicator
      password: ReplicaPassword123!
    superuser:
      username: postgres
      password: SuperPassword123!

  parameters:
    max_connections: 200
    shared_buffers: 4GB
    effective_cache_size: 12GB

tags:
  nofailover: false
  noloadbalance: false
  clonefrom: false
  nosync: false
```

```bash
# Enable and start Patroni
sudo systemctl enable patroni
sudo systemctl start patroni

# Check cluster status
sudo patronictl -c /etc/patroni/patroni.yml list postgres-ha
```

---

## Final Verification

### Test Connection

```bash
# From application server
psql -h DB-PRIVATE-IP -U app_user -d happytrip_b2b

# Test query
SELECT version();
SELECT current_database(), current_user;

# Check tables
\dt

# Exit
\q
```

### Performance Test

```sql
-- Run pgbench to test performance
sudo apt install postgresql-16-pgbench -y

# Initialize database
pgbench -i -s 50 -h DB-PRIVATE-IP -U app_user happytrip_b2b

# Run benchmark
pgbench -c 10 -j 2 -t 1000 -h DB-PRIVATE-IP -U app_user happytrip_b2b

# Expected results:
# tps = 1000-5000 (depending on instance size)
```

---

## Maintenance Tasks

### Regular Maintenance

```bash
# Vacuum and analyze (weekly)
sudo -u postgres psql -d happytrip_b2b -c "VACUUM ANALYZE;"

# Reindex (monthly)
sudo -u postgres psql -d happytrip_b2b -c "REINDEX DATABASE happytrip_b2b;"

# Check table bloat
sudo -u postgres psql -d happytrip_b2b -c "
SELECT schemaname, tablename,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS size,
  pg_stat_get_dead_tuples(c.oid) AS dead_tuples
FROM pg_class c
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE relkind = 'r' AND n.nspname = 'app'
ORDER BY pg_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Updates and Patches

```bash
# Check available updates
sudo apt list --upgradable | grep postgresql

# Update PostgreSQL (with care!)
sudo apt update
sudo apt upgrade postgresql-16

# Test before restarting in production
sudo systemctl restart postgresql
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## EC2 vs RDS - Final Recommendation

### For B2B Travel Portal:

| Environment | Recommendation | Why |
|-------------|----------------|-----|
| **Development** | ✅ EC2 (t3.small) | Cost: ~$15/month, Full control |
| **Staging** | ✅ EC2 (t3.medium) | Cost: ~$30/month, Production-like |
| **Production (Small)** | ⚠️ RDS (db.t3.medium) | Cost: ~$100/month, Peace of mind |
| **Production (Large)** | ⚠️ EC2 (m6g.xlarge) | Cost: ~$240/month vs RDS ~$560/month |

### My Recommendation:

```
┌─────────────────────────────────────────────────────────┐
│                   START WITH RDS                        │
│                                                          │
│  For production, use RDS unless:                        │
│  1. You have experienced DBA on team                    │
│  2. Cost is primary concern                             │
│  3. Need custom PostgreSQL extensions                   │
│  4. Database > 500GB                                    │
│                                                          │
│  For development/staging, EC2 is perfect!               │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### EC2 PostgreSQL Commands

```bash
# Start/Stop/Restart
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql
psql -h HOST -U USER -d DATABASE

# Backup
pg_dump -U USER -d DATABASE > backup.sql
pg_dumpall -U postgres > full_backup.sql

# Restore
psql -U USER -d DATABASE < backup.sql

# Check running queries
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Kill connection
sudo -u postgres psql -c "SELECT pg_terminate_backend(PID);"

# Reload configuration
sudo -u postgres psql -c "SELECT pg_reload_conf();"
```

---

## Next Steps

After setting up PostgreSQL on EC2:

1. ✅ Set up replication (if production)
2. ✅ Configure automated backups
3. ✅ Set up monitoring and alerts
4. ✅ Test failover procedures
5. ✅ Document maintenance procedures
6. ✅ Train team on operations

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
