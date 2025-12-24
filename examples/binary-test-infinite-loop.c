// Vehicle Edge Runtime Binary Test Application
// Infinite loop with 1-second interval printing
// Compile for ARM64 and x86_64 architectures

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <time.h>

#define PROGRAM_NAME "Vehicle Binary Test"
#define VERSION "1.0.0"

int main() {
    printf("🚗 Starting %s v%s\n", PROGRAM_NAME, VERSION);
    printf("==================================\n");
    printf("This binary demonstrates infinite loop with 1-second intervals\n");
    printf("Suitable for testing vehicle edge runtime deployment\n");
    printf("==================================\n\n");

    int iteration = 0;
    time_t start_time = time(NULL);

    printf("⏰ Infinite loop started at %s", ctime(&start_time));
    printf("Press Ctrl+C to stop\n\n");

    // Infinite loop with 1-second interval
    while (1) {
        iteration++;

        // Get current time
        time_t current_time = time(NULL);
        struct tm *time_info = localtime(&current_time);

        // Print timestamp and iteration info
        printf("[%s] Iteration %d - Runtime: %d seconds - PID: %d\n",
               asctime(time_info),
               iteration,
               (int)(current_time - start_time),
               getpid()
        );

        // Print vehicle-specific simulation data
        printf("🚗 Vehicle Status: Active | System Load: Normal\n");
        printf("📡 Signal Ready: VSS:Vehicle.Speed (read/write)\n");
        printf("🌐 HTTP Server: http://localhost:8080/health\n");
        printf("📡 gRPC Server: localhost:50051\n");
        printf("---\n");

        // Flush output to ensure it appears immediately
        fflush(stdout);

        // Sleep for 1 second (1000000 microseconds)
        usleep(1000000);
    }

    // This line should never be reached
    return 0;
}

/*
Compilation Commands:

# For x86_64:
gcc -o vehicle-test-x86_64 binary-test-infinite-loop.c

# For ARM64 (cross-compile if needed):
aarch64-linux-gnu-gcc -o vehicle-test-arm64 binary-test-infinite-loop.c

# Universal (detect architecture):
gcc -o vehicle-test binary-test-infinite-loop.c

# Static linking (for embedded systems):
gcc -static -o vehicle-test binary-test-infinite-loop.c

# With optimization:
gcc -O2 -o vehicle-test binary-test-infinite-loop.c

# Strip symbols for smaller binary:
gcc -s -o vehicle-test binary-test-infinite-loop.c

# Check binary architecture:
file vehicle-test
readelf -h vehicle-test
*/