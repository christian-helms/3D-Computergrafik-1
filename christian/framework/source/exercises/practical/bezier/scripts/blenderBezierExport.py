import bpy

def printPoint(point, end=","):
    print("        [ %f, %f, %f ]%s" % (point.x, point.z, -point.y, end))

for curve in bpy.data.curves:
    for spline in curve.splines:
        print("[")
        length = len(spline.bezier_points)
        for index, handle in enumerate(spline.bezier_points):
            print("    [")
            printPoint(handle.co)
            printPoint(handle.handle_right)
            next = spline.bezier_points[(index + 1) % length]
            printPoint(next.handle_left)
            printPoint(next.co, "")
            if(index == length - 1):
                print("    ]")
            else:
                print("    ],")
        print("]")
