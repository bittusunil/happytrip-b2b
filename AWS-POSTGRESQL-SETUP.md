# AWS PostgreSQL Setup Guide for B2B Travel Portal

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Options](#architecture-options)
4. [Deployment Methods](#deployment-methods)
5. [Step-by-Step Setup (AWS RDS)](#step-by-step-setup-aws-rds)
6. [Security Best Practices](#security-best-practices)
7. [Performance Optimization](#performance-optimization)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Monitoring & Alerts](#monitoring--alerts)
10. [Cost Optimization](#cost-optimization)
11. [Connection Pooling](#connection-pooling)
12. [Migration Strategy](#migration-strategy)

---

## Overview

This guide covers setting up a production-ready PostgreSQL database on AWS for the B2B Travel Portal application.

### AWS PostgreSQL Service Options

| Service | Best For | Pricing Model |
|---------|----------|---------------|
| **Amazon RDS PostgreSQL** | General purpose, managed relational DB | Hourly + storage + I/O |
| **Amazon Aurora PostgreSQL** | High performance, 5x faster than standard | Higher per-hour cost, lower I/O cost |
| **Amazon RDS Proxy** | Connection pooling for serverless | Per vCPU hour |
| **Self-managed on EC2** | Full control, cost optimization | EC2 instance cost only |

**Recommendation:** Start with **Amazon RDS PostgreSQL** for ease of management. Scale to Aurora if needed.

---

## Prerequisites

### AWS Account Setup
- Active AWS account with appropriate permissions
- AWS CLI installed and configured
- Basic understanding of VPC, subnets, and security groups

### Required Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:*",
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:CreateSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "cloudwatch:*",
        "sns:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Tools Required
- AWS CLI v2+
- PostgreSQL client (psql)
- Database IDE (DataGrip, DBeaver, pgAdmin)

---

## Architecture Options

### Option 1: Single-AZ Deployment (Development/Staging)

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
                    │   RDS PostgreSQL│
                    │    Single-AZ    │
                    └─────────────────┘
```

**Cost:** ~$50-200/month

### Option 2: Multi-AZ Deployment (Production)

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
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐       ┌──────────▼──────────┐
    │  Primary Instance │◄──────│   Standby Instance  │
    │   (Writer Node)   │       │   (Reader Node)     │
    │    Availability   │       │   (Async Replication)│
    │       Zone A      │       │     Zone B          │
    └───────────────────┘       └─────────────────────┘
              │
              ▼ (Automatic Failover)
    ┌─────────────────────┐
    │   Promoted to       │
    │   Primary Instance  │
    └─────────────────────┘
```

**Cost:** ~$200-600/month

### Option 3: Aurora PostgreSQL (High-Performance Production)

```
                    ┌─────────────────┐
                    │   Application   │
                    │   (EC2/ECS)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  RDS Proxy      │
                    │ (Connection     │
                    │   Pooling)      │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │   Aurora Cluster            │
              │   ┌─────────────────────┐  │
              │   │   Primary Instance  │  │
              │   │   (Writer)          │  │
              │   └─────────────────────┘  │
              │   ┌─────────────────────┐  │
              │   │   Reader Instance   │  │
              │   │   (Read Replicas)   │  │
              │   └─────────────────────┘  │
              │   ┌─────────────────────┐  │
              │   │   Reader Instance   │  │
              │   └─────────────────────┘  │
              │   Shared Storage Layer     │
              └─────────────────────────────┘
```

**Cost:** ~$400-1500/month

---

## Deployment Methods

### Method 1: AWS Console (Recommended for First Time)
### Method 2: AWS CLI
### Method 3: AWS CloudFormation/CDK (Recommended for IaC)
### Method 4: Terraform (Cross-cloud compatible)

---

## Step-by-Step Setup (AWS RDS)

### 1. Network Setup

#### 1.1 Create VPC (or use existing)
```bash
# Check existing VPCs
aws ec2 describe-vpcs --query "Vpcs[?IsDefault].{VpcId:VpcId,Cidr:CidrBlock}"

# Note the default VPC ID for next steps
```

#### 1.2 Create Database Subnet Group

```bash
# Create subnet group in at least 2 AZs
aws rds create-db-subnet-group \
  --db-subnet-group-name happytrip-b2b-subnet-group \
  --db-subnet-group-description "Subnet group for B2B Travel Portal" \
  --subnet-ids subnet-abc123 subnet-def456 \
  --region ap-south-1
```

**Via Console:**
1. Navigate to RDS → Subnet groups
2. Create subnet group
3. Select VPC
4. Choose private subnets from at least 2 Availability Zones
5. Name: `happytrip-b2b-subnet-group`

---

### 2. Security Group Configuration

#### 2.1 Create Security Group for RDS

```bash
# Create security group
aws ec2 create-security-group \
  --group-name happytrip-b2b-rds-sg \
  --description "Security group for RDS PostgreSQL" \
  --vpc-id vpc-xxxxx

# Save the GroupId from output
SG_ID="sg-xxxxx"
```

#### 2.2 Configure Inbound Rules

```bash
# Allow access from application servers
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group sg-yyyyy  # Your application SG

# Or allow from specific CIDR (for development only)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16
```

**Via Console:**
1. EC2 → Security Groups → Create
2. Name: `happytrip-b2b-rds-sg`
3. Inbound Rules:
   - Type: PostgreSQL/Aurora
   - Port: 5432
   - Source: Application security group or specific IP

---

### 3. Parameter Group Setup

#### 3.1 Create Custom Parameter Group

```bash
# Get latest PostgreSQL parameter group family
aws rds describe-db-engine-versions \
  --engine postgres \
  --query 'DBEngineVersions[?contains(EngineVersion, `16`)].{Family:DBParameterGroupFamily}' \
  --output text | head -1

# Create custom parameter group
aws rds create-db-parameter-group \
  --db-parameter-group-name happytrip-b2b-pg16-custom \
  --db-parameter-group-family postgresql16 \
  --description "Custom parameters for B2B Travel Portal"
```

#### 3.2 Configure Parameters

```bash
# Performance tuning parameters
aws rds modify-db-parameter-group \
  --db-parameter-group-name happytrip-b2b-pg16-custom \
  --parameters "[
    {
      \"ParameterName\": \"shared_buffers\",
      \"ParameterValue\": \"2560MB\",
      \"ApplyMethod\": \"pending-reboot\"
    },
    {
      \"ParameterName\": \"effective_cache_size\",
      \"ParameterValue\": \"8GB\",
      \"ApplyMethod\": \"pending-reboot\"
    },
    {
      \"ParameterName\": \"maintenance_work_mem\",
      \"ParameterValue\": \"1024MB\",
      \"ApplyMethod\": \"pending-reboot\"
    },
    {
      \"ParameterName\": \"checkpoint_completion_target\",
      \"ParameterValue\": \"0.9\",
      \"ApplyMethod\": \"immediate\"
    },
    {
      \"ParameterName\": \"wal_buffers\",
      \"ParameterValue\": \"16MB\",
      \"ApplyMethod\": \"pending-reboot\"
    },
    {
      \"ParameterName\": \"default_statistics_target\",
      \"ParameterValue\": \"100\",
      \"ApplyMethod\": \"immediate\"
    },
    {
      \"ParameterName\": \"random_page_cost\",
      \"ParameterValue\": \"1.1\",
      \"ApplyMethod\": \"immediate\"
    },
    {
      \"ParameterName\": \"work_mem\",
      \"ParameterValue\": \"32MB\",
      \"ApplyMethod\": \"immediate\"
    },
    {
      \"ParameterName\": \"max_connections\",
      \"ParameterValue\": \"200\",
      \"ApplyMethod\": \"pending-reboot\"
    },
    {
      \"ParameterName\": \"log_min_duration_statement\",
      \"ParameterValue\": \"1000\",
      \"ApplyMethod\": \"immediate\"
    },
    {
      \"ParameterName\": \"log_statement\",
      \"ParameterValue\": \"all\",
      \"ApplyMethod\": \"immediate\"
    }
  ]"
```

#### 3.3 Recommended Parameters for B2B Portal

| Parameter | Value | Description |
|-----------|-------|-------------|
| `shared_buffers` | 25% of RAM | Memory for shared data |
| `effective_cache_size` | 75% of RAM | Memory available for disk cache |
| `work_mem` | 32MB | Memory per operation |
| `maintenance_work_mem` | 1GB | Memory for maintenance operations |
| `max_connections` | 200 | Max concurrent connections |
| `log_min_duration_statement` | 1000ms | Log slow queries (>1s) |
| `log_statement` | all | Log all SQL statements |

---

### 4. Create RDS PostgreSQL Instance

#### 4.1 Via AWS Console (Easier)

**Step-by-Step:**

1. Navigate to **RDS → Create database**
2. **Choose database creation method:** Standard create
3. **Engine options:**
   - Engine type: PostgreSQL
   - Engine version: 16.x (latest)
4. **Templates:**
   - Development: Free tier (db.t3.micro)
   - Production: Production/Free tier
5. **Settings:**
   ```
   DB instance identifier: happytrip-b2b-prod
   Master username: happytrip_admin
   Master password: [Use AWS Secrets Manager]
   ```
6. **Instance configuration:**
   ```
   Dev/Staging: db.t3.micro or db.t3.small
   Production: db.m6g.xlarge or db.m6g.2xlarge
   ```
7. **Storage:**
   ```
   Storage type: General Purpose SSD (gp3)
   Allocated storage: 100 GB (auto-scale up to 1000 GB)
   Maximum storage threshold: 1000 GB
   ```
8. **Availability & durability:**
   ```
   Multi-AZ DB instance: Yes (Production only)
   ```
9. **Connectivity:**
   ```
   VPC: [Your VPC]
   DB subnet group: happytrip-b2b-subnet-group
   Public access: No (Important!)
   VPC security group: happytrip-b2b-rds-sg
   Database port: 5432
   ```
10. **Database authentication:**
    ```
    Password authentication: Yes
    IAM database authentication: Yes (Recommended)
    ```
11. **Additional configuration:**
    ```
    DB parameter group: happytrip-b2b-pg16-custom
    Backup retention period: 7 days (production: 30 days)
    Backup window: 02:00-03:00 UTC
    Enhanced monitoring: Enabled (30 seconds)
    Performance Insights: Enabled
    Maintenance window: Sunday 03:00-04:00 UTC
    Deletion protection: Enabled (Production only)
    ```

#### 4.2 Via AWS CLI (Infrastructure as Code)

```bash
aws rds create-db-instance \
  --db-instance-identifier happytrip-b2b-prod \
  --db-instance-class db.m6g.xlarge \
  --engine postgres \
  --engine-version 16.1 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --master-username happytrip_admin \
  --master-user-password YourSecurePassword123! \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name happytrip-b2b-subnet-group \
  --db-parameter-group-name happytrip-b2b-pg16-custom \
  --backup-retention-period 30 \
  --preferred-backup-window 02:00-03:00 \
  --preferred-maintenance-window sun:03:00-sun:04:00 \
  --multi-az \
  --publicly-accessible false \
  --enable-cloudwatch-logs-exports '["postgresql","upgrade"]' \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --monitoring-interval 30 \
  --monitoring-role-arn arn:aws:iam::ACCOUNT_ID:role/rds-monitoring-role \
  --deletion-protection \
  --region ap-south-1 \
  --tags Key=Project,Value=HappyTripB2B Key=Environment,Value=Production
```

#### 4.3 Wait for Instance Creation

```bash
# Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier happytrip-b2b-prod

# Check status
aws rds describe-db-instances \
  --db-instance-identifier happytrip-b2b-prod \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address,Endpoint.Port]'
```

---

### 5. Connect to Database

#### 5.1 Get Connection Details

```bash
# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier happytrip-b2b-prod \
  --query 'DBInstances[0].Endpoint'

# Output:
# {
#   "Address": "happytrip-b2b-prod.xxxx.ap-south-1.rds.amazonaws.com",
#   "Port": 5432,
#   "HostedZoneId": "XXXXXX"
# }
```

#### 5.2 Connect via psql

```bash
# From EC2 instance in same VPC
psql -h happytrip-b2b-prod.xxxx.ap-south-1.rds.amazonaws.com \
     -U happytrip_admin \
     -d postgres \
     -p 5432

# Or via connection string
psql "postgresql://happytrip_admin:PASSWORD@happytrip-b2b-prod.xxxx.ap-south-1.rds.amazonaws.com:5432/postgres"
```

#### 5.3 Test Connection

```sql
-- Test connection
SELECT version();

-- Check current user
SELECT current_user, current_database();

-- Check timezone
SHOW timezone;

-- List databases
\l

-- List tables
\dt
```

---

### 6. Create Application Database

```sql
-- Create main database
CREATE DATABASE happytrip_b2b;

-- Connect to new database
\c happytrip_b2b

-- Create schemas
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS staging;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA app TO happytrip_admin;
GRANT ALL PRIVILEGES ON SCHEMA audit TO happytrip_admin;
GRANT ALL PRIVILEGES ON SCHEMA staging TO happytrip_admin;

-- Set default schema
ALTER DATABASE happytrip_b2b SET search_path TO app, public;

-- Verify
\dn
```

---

### 7. AWS Secrets Manager Setup

#### 7.1 Store Database Credentials

```bash
# Create secret in AWS Secrets Manager
aws secretsmanager create-secret \
  --name happytrip/b2b/prod/postgres \
  --description "PostgreSQL credentials for B2B Travel Portal" \
  --secret-string '{
    "username": "happytrip_admin",
    "password": "YourSecurePassword123!",
    "engine": "postgresql",
    "host": "happytrip-b2b-prod.xxxx.ap-south-1.rds.amazonaws.com",
    "port": 5432,
    "dbname": "happytrip_b2b",
    "dbInstanceIdentifier": "happytrip-b2b-prod"
  }' \
  --region ap-south-1

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id happytrip/b2b/prod/postgres \
  --region ap-south-1
```

#### 7.2 Enable Rotation (Optional but Recommended)

```bash
# Create rotation lambda (if needed)
# Or use AWS console to enable automatic rotation
```

---

## Security Best Practices

### 1. Network Security

#### 1.1 Private Subnets Only
- Database should NEVER be in public subnets
- Only application servers can access RDS
- Use security groups to restrict access

#### 1.2 Security Group Rules

```bash
# Whitelist only necessary IPs
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-ip 10.0.1.100/32  # Specific app server

# Revoke any broad access
aws ec2 revoke-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0
```

### 2. Encryption

#### 2.1 At Rest Encryption
- Enabled by default with `--storage-encrypted`
- Uses AWS KMS (Key Management Service)
- Automated key rotation

```bash
# Use custom KMS key
aws rds create-db-instance \
  --kms-key-id alias/happytrip-b2b-key \
  --storage-encrypted \
  ...
```

#### 2.2 In Transit Encryption
- Force SSL connections
- Set `sslmode=require` in connection string

```javascript
// Node.js connection string with SSL
const connectionString = "postgresql://user:pass@host:5432/db?sslmode=require";
```

```sql
-- Force SSL in PostgreSQL
ALTER SYSTEM SET ssl = ON;
ALTER SYSTEM SET ssl_min_protocol_version = 'TLSv1.2';

-- Reload configuration
SELECT pg_reload_conf();
```

### 3. IAM Database Authentication

```bash
# Enable IAM auth during creation or via modification
aws rds modify-db-instance \
  --db-instance-identifier happytrip-b2b-prod \
  --enable-iam-database-authentication \
  --apply-immediately
```

```javascript
// Connect using IAM auth (Node.js example)
const { Client } = require('pg');
const AWS = require('aws-sdk');

// Get temporary token
const signer = new AWS.RDS.Signer({
  region: 'ap-south-1',
  hostname: 'happytrip-b2b-prod.xxxx.rds.amazonaws.com',
  port: 5432,
  username: 'happytrip_admin'
});

const token = signer.getAuthToken({
  username: 'happytrip_admin'
});

// Connect with token
const client = new Client({
  host: 'happytrip-b2b-prod.xxxx.rds.amazonaws.com',
  port: 5432,
  database: 'happytrip_b2b',
  user: 'happytrip_admin',
  password: token,
  ssl: { rejectUnauthorized: true }
});
```

### 4. Least Privilege Access

```sql
-- Create application user with limited permissions
CREATE USER app_user WITH PASSWORD 'AppPassword123!';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE happytrip_b2b TO app_user;
GRANT USAGE ON SCHEMA app TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO app_user;

-- Prevent user from creating tables
REVOKE CREATE ON SCHEMA app FROM app_user;
REVOKE CREATE ON DATABASE happytrip_b2b FROM app_user;

-- Create read-only user for reporting
CREATE USER reporting_user WITH PASSWORD 'ReportPass123!';
GRANT CONNECT ON DATABASE happytrip_b2b TO reporting_user;
GRANT USAGE ON SCHEMA app TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO reporting_user;
```

---

## Performance Optimization

### 1. Instance Sizing Guide

| Concurrent Users | RAM | vCPU | Instance Class | Monthly Cost |
|------------------|-----|------|----------------|--------------|
| < 50 | 2 GB | 2 | db.t3.small | $30-50 |
| 50-200 | 8 GB | 2 | db.t3.medium | $100-150 |
| 200-500 | 16 GB | 4 | db.m6g.xlarge | $250-400 |
| 500-2000 | 32 GB | 8 | db.m6g.2xlarge | $500-800 |
| 2000+ | 64 GB+ | 16+ | db.m6g.4xlarge+ | $1000+ |

### 2. Storage Optimization

#### 2.1 Use GP3 Storage

```bash
# GP3 is cheaper and faster than GP2
aws rds modify-db-instance \
  --db-instance-identifier happytrip-b2b-prod \
  --storage-type gp3 \
  --allocated-storage 100 \
  --storage-throughput 500 \
  --iops 3000 \
  --apply-immediately
```

**GP3 Benefits:**
- Consistent performance (independent of storage size)
- Cost-effective for high I/O workloads
- Up to 500 MB/s throughput and 3,000 IOPS included

#### 2.2 Provisioned IOPS (if needed)

```bash
# For very high I/O requirements
aws rds create-db-instance \
  --storage-type io1 \
  --allocated-storage 500 \
  --iops 10000 \
  ...
```

### 3. Read Replicas

```bash
# Create read replica for reporting
aws rds create-db-instance-read-replica \
  --db-instance-identifier happytrip-b2b-prod-replica \
  --source-db-instance-identifier happytrip-b2b-prod \
  --db-instance-class db.m6g.large

# Create multiple replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier happytrip-b2b-prod-replica-2 \
  --source-db-instance-identifier happytrip-b2b-prod \
  --db-instance-class db.m6g.large
```

**Use Cases:**
- Reporting and analytics queries
- Backup generation (without impacting primary)
- Geographic distribution

### 4. Connection Pooling with RDS Proxy

```bash
# Create RDS Proxy
aws rds create-db-proxy \
  --db-proxy-name happytrip-b2b-proxy \
  --engine-family postgresql \
  --auth '{
    "AuthScheme": "SECRETS",
    "SecretArn": "arn:aws:secretsmanager:ap-south-1:ACCOUNT_ID:secret:happytrip/b2b/prod/postgres",
    "IAMAuth": "REQUIRED"
  }' \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/rds-proxy-role \
  --vpc-subnet-ids subnet-abc123 subnet-def456 \
  --vpc-security-group-ids sg-xxxxx \
  --require-tls \
  --idle-client-timeout 1800

# Register database
aws rds register-db-proxy-targets \
  --db-proxy-name happytrip-b2b-proxy \
  --db-instance-identifiers happytrip-b2b-prod

# Get proxy endpoint
aws rds describe-db-proxies \
  --db-proxy-name happytrip-b2b-proxy \
  --query 'DBProxies[0].Endpoint'
```

**RDS Proxy Benefits:**
- Reduces failover time by 66%
- Pool and share connections
- Enforce IAM authentication
- Reduce CPU overhead

---

## Backup & Disaster Recovery

### 1. Automated Backups

```bash
# Modify backup settings
aws rds modify-db-instance \
  --db-instance-identifier happytrip-b2b-prod \
  --backup-retention-period 30 \
  --preferred-backup-window 02:00-03:00 \
  --copy-tags-to-snapshot \
  --apply-immediately
```

**Retention Periods:**
- Development: 1-7 days
- Staging: 7-14 days
- Production: 30 days (minimum for compliance)

### 2. Manual Snapshots

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier happytrip-b2b-prod \
  --db-snapshot-identifier happytrip-b2b-prod-manual-$(date +%Y%m%d) \
  --tags Key=Type,Value=Manual

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier happytrip-b2b-prod \
  --query 'reverse(DBSnapshots[:5])'

# Copy snapshot to another region (DR)
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier happytrip-b2b-prod-manual-20240115 \
  --target-db-snapshot-identifier happytrip-b2b-dr-snapshot \
  --source-region ap-south-1 \
  --region us-east-1
```

### 3. Point-in-Time Recovery (PITR)

```sql
-- PostgreSQL allows PITR using backups
-- Can restore to any second within retention period

-- Restore from snapshot via AWS CLI
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier happytrip-b2b-prod-restored \
  --db-snapshot-identifier happytrip-b2b-prod-manual-20240115 \
  --db-subnet-group-name happytrip-b2b-subnet-group \
  --multi-az
```

### 4. Cross-Region Replication

```bash
# Create read replica in different region (DR)
aws rds create-db-instance-read-replica \
  --db-instance-identifier happytrip-b2b-dr-replica \
  --source-db-instance-identifier happytrip-b2b-prod \
  --source-region ap-south-1 \
  --region us-east-1 \
  --db-instance-class db.m6g.xlarge
```

---

## Monitoring & Alerts

### 1. CloudWatch Metrics

**Key Metrics to Monitor:**

| Metric | Description | Alarm Threshold |
|--------|-------------|-----------------|
| `CPUUtilization` | CPU usage | > 80% for 5 minutes |
| `FreeStorageSpace` | Available disk space | < 10 GB |
| `FreeableMemory` | Available RAM | < 1 GB |
| `DatabaseConnections` | Active connections | > 150 (for max 200) |
| `ReadLatency` | Read operation time | > 100ms |
| `WriteLatency` | Write operation time | > 100ms |
| `ReplicationLag` | Replica lag (if applicable) | > 5 seconds |

### 2. Create CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name happytrip-b2b-cpu-high \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=happytrip-b2b-prod

# Free storage space alarm
aws cloudwatch put-metric-alarm \
  --alarm-name happytrip-b2b-disk-low \
  --alarm-description "Alert when free storage < 10GB" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10737418240 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=happytrip-b2b-prod

# Database connections alarm
aws cloudwatch put-metric-alarm \
  --alarm-name happytrip-b2b-connections-high \
  --alarm-description "Alert when connections exceed 150" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 60 \
  --evaluation-periods 3 \
  --threshold 150 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=happytrip-b2b-prod
```

### 3. Enable Enhanced Monitoring

```bash
# Enhanced monitoring provides OS-level metrics
aws rds modify-db-instance \
  --db-instance-identifier happytrip-b2b-prod \
  --monitoring-interval 30 \
  --monitoring-role-arn arn:aws:iam::ACCOUNT_ID:role/rds-monitoring-role \
  --apply-immediately
```

### 4. Performance Insights

```bash
# Performance Insights is available for additional cost
# Provides SQL-level query performance analysis
aws rds modify-db-instance \
  --db-instance-identifier happytrip-b2b-prod \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --apply-immediately
```

---

## Cost Optimization

### 1. Instance Selection

**Development/Staging:**
- Use `db.t3.micro` or `db.t3.small` for cost savings
- Use Multi-AZ only for production
- Stop instances when not in use

```bash
# Stop development instance
aws rds stop-db-instance \
  --db-instance-identifier happytrip-b2b-dev \
  --db-snapshot-identifier happytrip-b2b-dev-before-stop
```

**Production:**
- Start with `db.m6g.xlarge` (Graviton processors - 20% cheaper)
- Scale up based on monitoring
- Use 3-year reserved instances for 40%+ savings

### 2. Reserved Instances

```bash
# Purchase reserved instance for 40% discount
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id xxxxx \
  --db-instance-class db.m6g.xlarge \
  --db-instance-count 1 \
  --duration 3 \
  --offering-type "All Upfront"
```

### 3. Storage Optimization

- Use GP3 instead of GP2 for cost savings
- Enable storage autoscaling (pay for what you use)
- Archive old data to S3 using AWS DMS

### 4. Cost Comparison (Mumbai Region)

| Instance Type | vCPU | RAM | On-Demand Hourly | Reserved (3yr) |
|---------------|------|-----|-----------------|----------------|
| db.t3.micro | 2 | 1 GB | $0.017 | $0.009 |
| db.t3.small | 2 | 2 GB | $0.034 | $0.018 |
| db.t3.medium | 2 | 4 GB | $0.068 | $0.036 |
| db.m6g.xlarge | 4 | 16 GB | $0.254 | $0.134 |
| db.m6g.2xlarge | 8 | 32 GB | $0.508 | $0.268 |

*Prices approximate, check AWS for current rates*

---

## Connection Pooling

### Option 1: RDS Proxy (AWS-managed)

**Setup** (covered in Performance Optimization section)

**Connection String:**
```
postgresql://user:pass@proxy-instance.proxy-xxxxx.ap-south-1.rds.amazonaws.com:5432/db
```

### Option 2: PgBouncer (Self-managed)

```bash
# Install PgBouncer on EC2
sudo apt-get install pgbouncer

# Configure pgbouncer.ini
[databases]
happytrip_b2b = host=happytrip-b2b-prod.xxxx.rds.amazonaws.com port=5432 dbname=happytrip_b2b

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
reserve_pool_size = 20
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600

# Add users to userlist.txt
echo "happytrip_admin:passwordhash" >> /etc/pgbouncer/userlist.txt

# Restart PgBouncer
sudo systemctl restart pgbouncer
sudo systemctl enable pgbouncer
```

**Connection String:**
```
postgresql://user:pass@pgbouncer-server:6432/happytrip_b2b
```

### Option 3: Application-Level Pooling

**Node.js with pg-pool:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'happytrip-b2b-prod.xxxx.rds.amazonaws.com',
  port: 5432,
  database: 'happytrip_b2b',
  user: 'happytrip_admin',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: true },
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use pool
const client = await pool.connect();
try {
  await client.query('SELECT NOW()');
} finally {
  client.release();
}
```

---

## Migration Strategy

### 1. Schema Migration

```bash
# Use pg_dump to export schema
pg_dump -h localhost -U postgres -d happytrip_b2b --schema-only -f schema.sql

# Apply schema to RDS
psql -h happytrip-b2b-prod.xxxx.rds.amazonaws.com -U happytrip_admin -d happytrip_b2b -f schema.sql
```

### 2. Data Migration

#### Option A: pg_dump (small databases)

```bash
# Export data
pg_dump -h localhost -U postgres -d happytrip_b2b --data-only -f data.sql

# Import to RDS
psql -h happytrip-b2b-prod.xxxx.rds.amazonaws.com -U happytrip_admin -d happytrip_b2b -f data.sql
```

#### Option B: AWS DMS (large databases)

1. Create DMS replication instance
2. Create source endpoint (existing database)
3. Create target endpoint (RDS PostgreSQL)
4. Create migration task
5. Run migration

#### Option C: Logical Replication

```sql
-- On source database
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;

-- Reload and restart
SELECT pg_reload_conf();

-- Create publication
CREATE PUBLICATION happytrip_pub FOR ALL TABLES;

-- Create replication slot
SELECT * FROM pg_create_logical_replication_slot('happytrip_slot', 'pgoutput');
```

```sql
-- On RDS target
-- Create subscription (if RDS supports logical replication)
CREATE SUBSCRIPTION happytrip_sub
CONNECTION 'host=source-host port=5432 dbname=happytrip_b2b user=replicator password=xxx'
PUBLICATION happytrip_pub
WITH (create_slot = false, slot_name = 'happytrip_slot');
```

### 3. Migration Checklist

- [ ] Export schema from source
- [ ] Create parameter group on RDS
- [ ] Create RDS instance
- [ ] Apply schema to RDS
- [ ] Migrate data
- [ ] Verify row counts
- [ ] Test application connectivity
- [ ] Performance test
- [ ] Cutover to RDS
- [ ] Decommission old database

---

## Troubleshooting

### Common Issues

#### 1. Connection Timeout

```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Check if instance is publicly accessible (should be NO)
aws rds describe-db-instances --db-instance-identifier happytrip-b2b-prod \
  --query 'DBInstances[0].PubliclyAccessible'
```

#### 2. Connection Pool Exhausted

```bash
# Check current connections
psql -h HOST -U USER -d DB -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Increase max_connections in parameter group
aws rds modify-db-parameter-group \
  --db-parameter-group-name happytrip-b2b-pg16-custom \
  --parameters "ParameterName=max_connections,ParameterValue=300,ApplyMethod=pending-reboot"

# Reboot instance for changes to take effect
aws rds reboot-db-instance --db-instance-identifier happytrip-b2b-prod
```

#### 3. Slow Query Performance

```sql
-- Enable query logging (temporary)
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1s
SELECT pg_reload_conf();

-- Check pg_stat_statements
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Explain slow query
EXPLAIN ANALYZE SELECT * FROM bookings WHERE agent_id = 'xxx';

-- Create missing indexes
CREATE INDEX CONCURRENTLY idx_bookings_agent_status
ON bookings(agent_id, booking_status);
```

#### 4. Storage Full

```bash
# Check storage
aws rds describe-db-instances --db-instance-identifier happytrip-b2b-prod \
  --query 'DBInstances[0].[AllocatedStorage,FreeStorageSpace]'

-- Enable storage autoscaling
aws rds modify-db-instance \
  --db-instance-identifier happytrip-b2b-prod \
  --max-allocated-storage 1000 \
  --apply-immediately

-- Or manually increase storage
aws rds modify-db-instance \
  --db-instance-identifier happytrip-b2b-prod \
  --allocated-storage 200 \
  --apply-immediately
```

---

## Best Practices Summary

### ✅ DO:
- Use Multi-AZ for production
- Enable encryption at rest and in transit
- Use IAM authentication
- Store credentials in Secrets Manager
- Enable enhanced monitoring and Performance Insights
- Set up CloudWatch alarms
- Use read replicas for reporting
- Enable automated backups (30-day retention)
- Use RDS Proxy for connection pooling
- Create snapshots before major changes
- Use parameter groups for configuration

### ❌ DON'T:
- Expose database to public internet
- Use root/master user in applications
- Hardcode passwords in code
- Skip backups
- Ignore monitoring alerts
- Use default parameter group
- Under-provision resources
- Forget deletion protection
- Skip SSL/TLS connections

---

## Quick Reference Commands

```bash
# Describe instance
aws rds describe-db-instances --db-instance-identifier happytrip-b2b-prod

# Stop instance
aws rds stop-db-instance --db-instance-identifier happytrip-b2b-prod

# Start instance
aws rds start-db-instance --db-instance-identifier happytrip-b2b-prod

# Reboot instance
aws rds reboot-db-instance --db-instance-identifier happytrip-b2b-prod

# Create snapshot
aws rds create-db-snapshot --db-instance-identifier happytrip-b2b-prod --db-snapshot-identifier snapshot-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot --db-instance-identifier restored-db --db-snapshot-identifier snapshot-20240115

# Modify instance
aws rds modify-db-instance --db-instance-identifier happytrip-b2b-prod --allocated-storage 200 --apply-immediately

# Delete instance (use with caution!)
aws rds delete-db-instance --db-instance-identifier happytrip-b2b-prod --skip-final-snapshot --delete-automated-backups
```

---

## Next Steps

1. ✅ Set up RDS PostgreSQL instance
2. ✅ Configure security groups and networking
3. ✅ Create database and schemas
4. ✅ Set up monitoring and alerts
5. ✅ Create backup strategy
6. ✅ Test connectivity from application
7. ✅ Run migration scripts
8. ✅ Set up CI/CD pipeline
9. ✅ Document procedures
10. ✅ Train team on operations

---

## Additional Resources

- [AWS RDS PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS RDS Pricing](https://aws.amazon.com/rds/postgresql/pricing/)
- [AWS Database Blog](https://aws.amazon.com/blogs/database/)
- [pgBouncer Documentation](https://www.pgbouncer.org/usage.html)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Author:** HappyTrip B2B Team
