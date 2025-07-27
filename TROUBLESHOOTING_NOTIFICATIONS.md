# Notification System Troubleshooting Guide

## Current Issues

### 1. 404 Errors for Notification Endpoints
**Problem**: Frontend is getting 404 errors when trying to access notification endpoints
**Root Cause**: Backend notification service is not properly configured or running

### 2. Product with 4 Quantity Not Triggering Notifications
**Problem**: Creating a product with low stock (≤5 units) is not generating notifications
**Root Cause**: Backend notification service may not be running or properly configured

## Solutions

### Step 1: Verify Backend Services are Running

1. **Check if all services are running**:
   ```bash
   # Check if services are running on expected ports
   netstat -an | findstr :8080  # Gateway Service
   netstat -an | findstr :8761  # Eureka Server
   netstat -an | findstr :8081  # Product Service
   ```

2. **Restart the Product Service**:
   ```bash
   cd SmartStock_backend/ProductService
   mvn spring-boot:run
   ```

### Step 2: Verify Database Configuration

1. **Check if the admin_notifications table exists**:
   ```sql
   -- Connect to your PostgreSQL database
   \dt admin_notifications;
   ```

2. **Check if there are any notifications in the database**:
   ```sql
   SELECT * FROM admin_notifications;
   ```

### Step 3: Test Notification Endpoints Manually

1. **Test the notification count endpoint**:
   ```bash
   curl -X GET "http://localhost:8080/api/admin/notifications/count" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Test the notifications list endpoint**:
   ```bash
   curl -X GET "http://localhost:8080/api/admin/notifications" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Step 4: Verify JWT Authentication

1. **Check if JWT token is valid**:
   - Ensure you're logged in as an admin user
   - Check if the JWT token is being sent in requests
   - Verify the token hasn't expired

2. **Test with a valid admin token**:
   ```bash
   # Get a valid JWT token by logging in as admin
   curl -X POST "http://localhost:8080/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"password"}'
   ```

### Step 5: Check Application Logs

1. **Check Product Service logs**:
   - Look for any errors related to notification service
   - Check if JWT filter is working properly
   - Verify if notification service is being called

2. **Check Gateway Service logs**:
   - Look for routing errors
   - Check if requests are being forwarded to Product Service

### Step 6: Manual Testing

1. **Create a product with low stock**:
   - Use the admin interface to create a product with stock quantity ≤5
   - Check if notification is created in database
   - Check application logs for any errors

2. **Update an existing product to low stock**:
   - Update a product's stock quantity to ≤5
   - Check if notification is triggered

## Debugging Steps

### Frontend Debugging

1. **Enable debug logging**:
   ```javascript
   // In browser console
   localStorage.setItem('debug-notifications', 'true')
   ```

2. **Check network requests**:
   - Open browser developer tools
   - Go to Network tab
   - Look for failed requests to notification endpoints

3. **Check console errors**:
   - Look for JavaScript errors
   - Check for API call failures

### Backend Debugging

1. **Add debug logging to notification service**:
   ```java
   @Service
   public class AdminNotificationService {
       
       private static final Logger logger = LoggerFactory.getLogger(AdminNotificationService.class);
       
       @Transactional
       public void checkLowStockAndNotify(Product product) {
           logger.info("Checking low stock for product: {} with quantity: {}", 
                      product.getName(), product.getStockQuantity());
           
           if (product.getStockQuantity() < lowStockThreshold) {
               logger.info("Product {} has low stock ({}), creating notification", 
                          product.getName(), product.getStockQuantity());
               // ... rest of the method
           }
       }
   }
   ```

2. **Check if notification service is being called**:
   - Add logging to ProductService methods
   - Verify notification service injection

## Common Issues and Solutions

### Issue 1: JWT Filter Not Working
**Solution**: Ensure JWT filter is properly configured and not commented out

### Issue 2: Database Connection Problems
**Solution**: Check database connection and ensure tables exist

### Issue 3: Service Discovery Issues
**Solution**: Ensure Eureka server is running and services are registered

### Issue 4: Gateway Routing Problems
**Solution**: Verify gateway routes are properly configured

## Testing the Complete Flow

1. **Start all services**:
   ```bash
   # Start Eureka Server
   cd SmartStock_backend/eureka-server
   mvn spring-boot:run
   
   # Start Gateway Service
   cd SmartStock_backend/GatewayService
   mvn spring-boot:run
   
   # Start Product Service
   cd SmartStock_backend/ProductService
   mvn spring-boot:run
   ```

2. **Test notification creation**:
   - Create a product with stock quantity = 4
   - Check database for notification
   - Check frontend for notification display

3. **Test notification retrieval**:
   - Login as admin user
   - Check notification bell
   - Verify notification count

## Expected Behavior

1. **When creating a product with stock ≤5**:
   - Notification should be created in database
   - Frontend should show notification badge
   - Notification should appear in notification list

2. **When updating product stock to ≤5**:
   - Notification should be created (if none exists in last 24h)
   - Frontend should update notification count

3. **When accessing notification endpoints**:
   - Should return 200 status with data
   - Should require valid admin JWT token

## Next Steps

If issues persist after following this guide:

1. Check application logs for specific error messages
2. Verify all services are running and healthy
3. Test with a fresh database
4. Check if there are any firewall or network issues
5. Verify JWT token generation and validation 